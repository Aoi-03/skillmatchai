from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    gemini_api_key: str = ""   # set in Railway environment variables
    groq_api_key: str = ""     # fallback — free at console.groq.com

    model_config = {"env_file": ".env"}


settings = Settings()
