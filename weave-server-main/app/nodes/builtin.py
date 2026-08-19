import asyncio
import json
import re
import smtplib
import ssl
from email.utils import formataddr, parseaddr

import httpx

from .base import BaseNode
from ..config import (
    GROQ_API_KEY,
    GROQ_MODEL,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USE_TLS,
    SMTP_USERNAME,
    SMTP_PASSWORD,
)


def resolve(value, context):
    if isinstance(value, dict):
        return {key: resolve(item, context) for key, item in value.items()}

    if isinstance(value, list):
        return [resolve(item, context) for item in value]

    if not isinstance(value, str):
        return value

    pattern = re.compile(r"\{\{\s*([^}]+?)\s*\}\}")

    def get_value(path):
        current = context

        for key in path.split("."):
            current = current.get(key, "") if isinstance(current, dict) else ""

        return current

    matches = list(pattern.finditer(value))

    if len(matches) == 1 and matches[0].span() == (0, len(value)):
        return get_value(matches[0].group(1))

    return pattern.sub(lambda match: str(get_value(match.group(1))), value)


async def groq_completion(messages, model, temperature=0.2):
    """Call Groq directly so execution does not depend on the optional SDK."""

    # Route any legacy/invalid model names to the currently configured model.
    KNOWN_LEGACY_MODELS = {"llama-3.3-70b-versatile", "openai/gpt-oss-120b"}
    if model in KNOWN_LEGACY_MODELS:
        model = GROQ_MODEL

    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": messages,
                "temperature": temperature,
            },
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]


def output_text(value):
    """Turn a connected node result into the text an email recipient expects."""

    if isinstance(value, dict):
        for key in ("output", "text", "message"):
            if value.get(key) not in (None, ""):
                return str(value[key])
        return json.dumps(value, ensure_ascii=False, indent=2)
    return "" if value is None else str(value)


class Manual(BaseNode):
    async def execute(self, input_data, config, context):
        return input_data


class Text(BaseNode):
    async def execute(self, input_data, config, context):
        return {
            "text": resolve(config.get("text", ""), context),
        }


class JSONInput(BaseNode):
    async def execute(self, input_data, config, context):
        value = resolve(config.get("value", {}), context)

        return json.loads(value) if isinstance(value, str) else value


class LLM(BaseNode):
    async def execute(self, input_data, config, context):
        prompt = resolve(config.get("prompt", ""), context)

        if not GROQ_API_KEY:
            return {
                "output": f"[MOCK LLM] {prompt}",
                "mock": True,
            }

        output = await groq_completion(
            messages=[{"role": "user", "content": str(prompt)}],
            model=config.get("model", GROQ_MODEL),
            temperature=float(config.get("temperature", 0.2)),
        )

        return {
            "output": output,
            "mock": False,
        }


class HTTP(BaseNode):
    async def execute(self, input_data, config, context):
        method = config.get("method", "GET").upper()
        url = resolve(config.get("url", ""), context)
        headers = resolve(config.get("headers", {}), context)
        body = resolve(config.get("body", {}), context)

        async with httpx.AsyncClient(
            timeout=float(config.get("timeout", 20))
        ) as client:
            response = await client.request(
                method,
                url,
                headers=headers,
                json=None if method in ("GET", "HEAD") else body,
            )

        try:
            data = response.json()
        except Exception:
            data = response.text

        return {
            "status_code": response.status_code,
            "data": data,
        }


class Weather(BaseNode):
    async def execute(self, input_data, config, context):
        city = resolve(
            config.get(
                "city",
                context.get("city", "") if isinstance(context, dict) else "",
            ),
            context,
        )

        latitude = resolve(config.get("latitude"), context)
        longitude = resolve(config.get("longitude"), context)

        async with httpx.AsyncClient(
            timeout=float(config.get("timeout", 20))
        ) as client:
            if latitude in (None, "") or longitude in (None, ""):
                if not city:
                    raise ValueError(
                        "Weather node needs a city, or latitude and longitude."
                    )

                geocoding_response = await client.get(
                    "https://geocoding-api.open-meteo.com/v1/search",
                    params={
                        "name": city,
                        "count": 1,
                        "language": "en",
                        "format": "json",
                    },
                )

                geocoding_response.raise_for_status()

                results = geocoding_response.json().get("results", [])

                if not results:
                    raise ValueError(f"Location not found: {city}")

                place = results[0]
                latitude = place["latitude"]
                longitude = place["longitude"]
                city = place["name"]

            weather_response = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": latitude,
                    "longitude": longitude,
                    "current": (
                        "temperature_2m,weather_code,"
                        "wind_speed_10m,precipitation"
                    ),
                    "timezone": "auto",
                },
            )

            weather_response.raise_for_status()
            current = weather_response.json()["current"]

        labels = {
            0: "Clear sky",
            1: "Mostly clear",
            2: "Partly cloudy",
            3: "Overcast",
            45: "Fog",
            48: "Rime fog",
            51: "Light drizzle",
            53: "Drizzle",
            55: "Heavy drizzle",
            61: "Light rain",
            63: "Rain",
            65: "Heavy rain",
            71: "Light snow",
            73: "Snow",
            75: "Heavy snow",
            80: "Rain showers",
            81: "Rain showers",
            82: "Heavy showers",
            95: "Thunderstorm",
        }

        weather_code = current["weather_code"]

        return {
            "location": city or f"{latitude}, {longitude}",
            "temperature_c": current["temperature_2m"],
            "weather_code": weather_code,
            "description": labels.get(weather_code, "Unknown conditions"),
            "wind_speed_kmh": current["wind_speed_10m"],
            "precipitation_mm": current["precipitation"],
            "is_good": (
                weather_code in (0, 1, 2)
                and current["precipitation"] == 0
            ),
        }


class Email(BaseNode):
    async def execute(self, input_data, config, context):
        sender = resolve(config.get("sender_email", ""), context)
        password = resolve(config.get("app_password", ""), context)
        recipient = resolve(config.get("to", ""), context)
        body = resolve(config.get("body", ""), context)
        # An email connected directly to another node should work without a
        # duplicate template stored in its configuration.
        if body in (None, ""):
            body = input_data
        body = output_text(body)
        subject = str(resolve(config.get("subject", ""), context)).strip()
        if not subject:
            subject = "Weave workflow update"

        host = SMTP_HOST
        port = SMTP_PORT
        use_tls = SMTP_USE_TLS

        sender_name, sender_address = parseaddr(str(sender))
        _, recipient_address = parseaddr(str(recipient))

        # Fall back to server-configured credentials if the workflow doesn't supply them.
        if not sender_address:
            sender_address = SMTP_USERNAME
        if not password or not str(password).strip():
            password = SMTP_PASSWORD

        if not sender_address:
            raise ValueError("Email node needs a valid sender_email.")

        if not recipient_address:
            raise ValueError("Email node needs a valid recipient email address.")

        if not isinstance(password, str) or not password.strip():
            raise ValueError("Email node needs an app_password for this send.")

        if not isinstance(host, str) or not host.strip():
            raise ValueError("Email node needs a valid SMTP host.")

        try:
            port = int(port)
        except (TypeError, ValueError):
            raise ValueError("Email node needs a valid SMTP port.")

        if not 1 <= port <= 65535:
            raise ValueError("Email node needs a valid SMTP port.")

        if "\n" in str(subject) or "\r" in str(subject):
            raise ValueError("Email subject cannot contain line breaks.")

        message = (
            f"From: {formataddr((sender_name, sender_address))}\r\n"
            f"To: {recipient_address}\r\n"
            f"Subject: {subject}\r\n"
            "Content-Type: text/plain; charset=utf-8\r\n\r\n"
            f"{body}"
        )

        def send_email():
            with smtplib.SMTP(host, port, timeout=20) as server:
                if use_tls:
                    server.starttls(context=ssl.create_default_context())

                server.login(sender_address, password)

                server.sendmail(
                    sender_address,
                    [recipient_address],
                    message.encode("utf-8"),
                )

        await asyncio.to_thread(send_email)

        return {
            "sent": True,
            "to": recipient_address,
            "subject": str(subject),
            "message": body,
        }


class Condition(BaseNode):
    async def execute(self, input_data, config, context):
        left = resolve(config.get("left"), context)
        right = resolve(config.get("right"), context)
        operator = config.get("operator", "equals")

        if operator == "equals":
            result = left == right
        elif operator == "not_equals":
            result = left != right
        elif operator == "contains":
            result = str(right) in str(left)
        elif operator == "exists":
            result = left not in (None, "", False)
        elif operator == "greater_than":
            result = float(left) > float(right)
        elif operator == "less_than":
            result = float(left) < float(right)
        else:
            raise ValueError("Unsupported operator")

        return {
            "result": result,
            "branch": "true" if result else "false",
            "data": input_data,
        }


class Transform(BaseNode):
    async def execute(self, input_data, config, context):
        operation = config.get("operation", "identity")
        value = resolve(config.get("value", input_data), context)

        if operation == "uppercase":
            return str(value).upper()

        if operation == "lowercase":
            return str(value).lower()

        if operation == "stringify":
            return json.dumps(value)

        if operation == "parse_json":
            return json.loads(value)

        if operation == "pick":
            return value.get(config.get("key"))

        return value


class Response(BaseNode):
    async def execute(self, input_data, config, context):
        return resolve(config.get("value", input_data), context)


NODE_REGISTRY = {
    "manual_trigger": Manual,
    "text": Text,
    "json": JSONInput,
    "llm": LLM,
    "http_request": HTTP,
    "weather": Weather,
    "email": Email,
    "condition": Condition,
    "transform": Transform,
    "response": Response,
}
