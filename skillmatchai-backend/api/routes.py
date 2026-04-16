import logging
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from .schemas import AllocationRequest
from .service import run_allocation

logger = logging.getLogger("skillmatch.routes")
router = APIRouter()


@router.post("/optimize-allocation")
async def optimize_allocation(payload: AllocationRequest):
    logger.info(
        "Allocation request received",
        extra={
            "volunteer_count": len(payload.volunteers),
            "task_count": len(payload.tasks),
        },
    )

    result = await run_allocation(payload.volunteers, payload.tasks)

    if result.get("error"):
        return JSONResponse(status_code=502, content=result)

    logger.info(
        "Allocation complete",
        extra={"allocation_count": len(result.get("allocations", []))},
    )
    return result
