from pydantic import BaseModel, field_validator
from typing import Literal


class Volunteer(BaseModel):
    id: str
    name: str
    skills: list[str]
    availability: str

    @field_validator("skills")
    @classmethod
    def skills_not_empty(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("skills array cannot be empty")
        return v


class Task(BaseModel):
    id: str
    title: str
    required_skills: list[str]
    urgency_level: Literal["Critical", "High", "Medium", "Low"]

    @field_validator("required_skills")
    @classmethod
    def required_skills_not_empty(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("required_skills array cannot be empty")
        return v


class AllocationRequest(BaseModel):
    volunteers: list[Volunteer]
    tasks: list[Task]

    @field_validator("volunteers")
    @classmethod
    def volunteers_not_empty(cls, v: list[Volunteer]) -> list[Volunteer]:
        if not v:
            raise ValueError("volunteers array cannot be empty")
        return v

    @field_validator("tasks")
    @classmethod
    def tasks_not_empty(cls, v: list[Task]) -> list[Task]:
        if not v:
            raise ValueError("tasks array cannot be empty")
        return v
