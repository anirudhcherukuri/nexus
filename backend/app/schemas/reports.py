from pydantic import BaseModel
from typing import Optional

class ReportExportRequest(BaseModel):
    simulation_id: str
    include_ai_insights: bool = True
    format: str = "pdf" # "pdf" or "csv"
