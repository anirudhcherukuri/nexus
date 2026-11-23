import io
import csv
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.simulation import SimulationRun
from app.models.tenant import Organization
from app.api.deps import get_current_org_id
from app.services.pdf_generator import EnterprisePDFReportGenerator

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/pdf/{simulation_id}")
def download_pdf_report(
    simulation_id: str,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id)
):
    sim = db.query(SimulationRun).filter(
        SimulationRun.id == simulation_id,
        SimulationRun.organization_id == org_id
    ).first()
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation run not found")

    org = db.query(Organization).filter(Organization.id == org_id).first()
    org_name = org.name if org else "Apex Manufacturing Group"

    sim_dict = {
        "id": sim.id,
        "name": sim.name,
        "total_revenue_loss": sim.total_revenue_loss,
        "total_units_lost": sim.total_units_lost,
        "max_delay_days": sim.max_delay_days,
        "stockout_day": sim.stockout_day,
        "resilience_score": sim.resilience_score,
        "run_summary": sim.run_summary,
        "executed_at": sim.executed_at.strftime("%Y-%m-%d %H:%M:%S") if sim.executed_at else "2026-11-23",
        "product_impacts": [
            {
                "product_name": p.product_name,
                "units_demanded": p.units_demanded,
                "units_produced": p.units_produced,
                "units_short": p.units_short,
                "total_revenue_loss": p.total_revenue_loss,
                "stockout_day": p.stockout_day
            }
            for p in sim.product_impacts
        ]
    }

    pdf_bytes = EnterprisePDFReportGenerator.generate(sim_dict, org_name=org_name)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=nexus_report_{sim.id[:8]}.pdf"}
    )

@router.get("/csv/{simulation_id}")
def download_csv_report(
    simulation_id: str,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_current_org_id)
):
    sim = db.query(SimulationRun).filter(
        SimulationRun.id == simulation_id,
        SimulationRun.organization_id == org_id
    ).first()
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation run not found")

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Day", "BaselineProduction", "ActualProduction", "UnitsLost",
        "AccumulatedBacklog", "ActiveDisruptions", "DailyFinancialLoss", "CumulativeFinancialLoss"
    ])

    for m in sim.daily_metrics:
        writer.writerow([
            m.day, m.baseline_production, m.actual_production, m.units_lost,
            m.accumulated_backlog, m.active_disruptions_count, m.daily_financial_loss, m.cumulative_financial_loss
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=nexus_simulation_daily_{sim.id[:8]}.csv"}
    )
