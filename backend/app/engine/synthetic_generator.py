import uuid
from typing import Dict, List, Any
from sqlalchemy.orm import Session
from app.models.tenant import Organization
from app.models.user import User, UserRole
from app.models.supply_network import (
    Supplier, Facility, Material, Product, BillOfMaterial, Inventory, SupplyEdge
)
from app.models.scenario import DisruptionScenario, DisruptionEvent

class ApexSyntheticDataGenerator:
    """
    Generates the complete synthetic enterprise dataset for Apex Manufacturing Group.
    All data is clearly marked as synthetic (is_synthetic=True).
    Contains realistic multi-tier topologies, bottleneck facilities, alternative suppliers,
    and single points of failure (SPOFs) for demonstration and testing.
    """

    def __init__(self, db: Session, organization_id: str):
        self.db = db
        self.org_id = organization_id

    def generate_all(self):
        # 1. Clean existing records for this tenant to ensure a clean seed
        self.db.query(SupplyEdge).filter(SupplyEdge.organization_id == self.org_id).delete()
        self.db.query(Inventory).filter(Inventory.organization_id == self.org_id).delete()
        self.db.query(BillOfMaterial).filter(BillOfMaterial.organization_id == self.org_id).delete()
        self.db.query(Product).filter(Product.organization_id == self.org_id).delete()
        self.db.query(Material).filter(Material.organization_id == self.org_id).delete()
        self.db.query(Supplier).filter(Supplier.organization_id == self.org_id).delete()
        self.db.query(Facility).filter(Facility.organization_id == self.org_id).delete()
        self.db.commit()

        # 2. Create Facilities (5 Manufacturing Plants + 3 Distribution Centers)
        facilities_data = [
            ("Detroit Assembly Plant", "PLANT-DET", "PLANT", "USA", "Detroit", 1200.0, 85.0, 42.3314, -83.0458),
            ("Stuttgart High-Tech Plant", "PLANT-STG", "PLANT", "Germany", "Stuttgart", 1000.0, 80.0, 48.7758, 9.1829),
            ("Tokyo Precision Hub", "PLANT-TKO", "PLANT", "Japan", "Tokyo", 900.0, 78.0, 35.6762, 139.6503),
            ("Ohio Heavy Component Works", "PLANT-OHI", "PLANT", "USA", "Cleveland", 1500.0, 92.0, 41.4993, -81.6944),
            ("Monterrey Assembly Plant", "PLANT-MTY", "PLANT", "Mexico", "Monterrey", 1100.0, 82.0, 25.6866, -100.3161),
            ("Chicago Logistics Hub", "DC-CHI", "DISTRIBUTION_CENTER", "USA", "Chicago", 3000.0, 65.0, 41.8781, -87.6298),
            ("Rotterdam Euro-Hub", "DC-RTM", "DISTRIBUTION_CENTER", "Netherlands", "Rotterdam", 2500.0, 70.0, 51.9244, 4.4777),
            ("Singapore Asian Gateway", "DC-SIN", "LOGISTICS_HUB", "Singapore", "Singapore", 2200.0, 60.0, 1.3521, 103.8198),
        ]

        facilities: Dict[str, Facility] = {}
        for name, code, ftype, country, city, cap, util, lat, lon in facilities_data:
            fac = Facility(
                organization_id=self.org_id,
                name=name,
                code=code,
                facility_type=ftype,
                country=country,
                city=city,
                daily_production_capacity=cap,
                current_utilization=util,
                latitude=lat,
                longitude=lon,
                operating_status="NORMAL",
                is_synthetic=True
            )
            self.db.add(fac)
            facilities[code] = fac
        self.db.commit()

        # 3. Create 40 Materials (Raw, Components, Modules)
        raw_materials = [
            ("RAW-STL-01", "High-Strength Structural Steel Sheet", "Raw Materials", 45.0, "kg", True),
            ("RAW-ALU-02", "Automotive Grade 6061 Aluminum Ingot", "Raw Materials", 65.0, "kg", False),
            ("RAW-COP-03", "Electrolytic High-Conductivity Copper Wire", "Raw Materials", 95.0, "kg", True),
            ("RAW-SIL-04", "Ultra-Pure Monocrystalline Silicon Wafers", "Raw Materials", 220.0, "wafer", True),
            ("RAW-REE-05", "Neodymium Rare Earth Magnets", "Raw Materials", 380.0, "kg", True),
            ("RAW-LIT-06", "Battery Grade Lithium Hydroxide", "Raw Materials", 310.0, "kg", True),
            ("RAW-NIC-07", "Class-1 High Purity Nickel Pellets", "Raw Materials", 140.0, "kg", False),
            ("RAW-POL-08", "Engineering Polymer Pellets (PEEK)", "Raw Materials", 75.0, "kg", False),
            ("RAW-CAR-09", "Aerospace Grade Carbon Fiber Tow", "Raw Materials", 185.0, "kg", True),
            ("RAW-RUB-10", "Synthetic Nitrile Elastomer Compound", "Raw Materials", 35.0, "kg", False),
            ("RAW-TIT-11", "Titanium Grade-5 Alloy Rods", "Raw Materials", 420.0, "kg", True),
            ("RAW-GLA-12", "Laminated HUD Safety Glass Substrate", "Raw Materials", 85.0, "sqm", False),
        ]

        components = [
            ("CMP-SEMI-01", "Automotive Radar MCU Microcontroller (40nm)", "Microcontrollers", 145.0, "unit", True),
            ("CMP-SEMI-02", "High-Current IGBT Power Transistor", "Power Electronics", 85.0, "unit", True),
            ("CMP-SNS-03", "Precision Multi-Axis IMU Inertial Sensor", "Sensors", 65.0, "unit", True),
            ("CMP-BRK-04", "Ceramic Composite Brake Rotor Disk", "Braking", 120.0, "unit", False),
            ("CMP-HAR-05", "Shielded High-Voltage Wiring Harness", "Electrical", 195.0, "unit", False),
            ("CMP-HYD-06", "High-Pressure Hydraulic Displacement Pump", "Hydraulics", 280.0, "unit", True),
            ("CMP-VLV-07", "Proportional Solenoid Electro-Hydraulic Valve", "Hydraulics", 160.0, "unit", False),
            ("CMP-MOT-08", "Permanent Magnet Synchronous Stator Core", "Motors", 340.0, "unit", True),
            ("CMP-TRB-09", "Variable Geometry Turbocharger Cartridge", "Powertrain", 410.0, "unit", False),
            ("CMP-ACT-10", "Brushless DC Steer-by-Wire Linear Actuator", "Steering", 225.0, "unit", True),
            ("CMP-BMS-11", "Digital Battery Cell Monitoring IC Module", "Power Electronics", 115.0, "unit", True),
            ("CMP-BEA-12", "Precision Ceramic Hybrid Ball Bearing Set", "Mechanical", 90.0, "set", False),
            ("CMP-FNT-13", "Machined Alloy Front Subframe Knuckle", "Chassis", 210.0, "unit", False),
            ("CMP-RAD-14", "Aluminum Plate-Fin High-Capacity Radiator", "Thermal", 130.0, "unit", False),
            ("CMP-INJ-15", "Piezoelectric Direct Fuel Injector", "Fuel Delivery", 175.0, "unit", False),
            ("CMP-DIS-16", "15-Inch Anti-Glare Touch Display Assembly", "Infotainment", 260.0, "unit", False),
        ]

        modules = [
            ("MOD-ADAS-01", "Level-3 Autonomous Radar Perception Array", "ADAS Modules", 850.0, "unit", True),
            ("MOD-BAT-02", "800V 95kWh High-Energy EV Battery Module", "Energy Storage", 3200.0, "pack", True),
            ("MOD-INV-03", "Silicon-Carbide Dual Motor Traction Inverter", "Power Electronics", 1450.0, "unit", True),
            ("MOD-CHAS-04", "Active Dynamic Suspension Chassis Assembly", "Chassis", 1150.0, "assembly", False),
            ("MOD-ENG-05", "3.0L Turbocharged Hybrid Powertrain Engine", "Powertrain", 2800.0, "unit", False),
            ("MOD-GBX-06", "8-Speed Dual-Clutch Electronic Transmission", "Drivetrain", 1850.0, "unit", True),
            ("MOD-STEER-07", "Dual-Redundant Electronic Steer-by-Wire Column", "Steering", 920.0, "unit", True),
            ("MOD-COOL-08", "Thermal Management Integrated Chiller Loop", "Thermal", 680.0, "unit", False),
            ("MOD-PDU-09", "Smart High-Voltage Power Distribution Unit", "Electrical", 540.0, "unit", False),
            ("MOD-HYD-10", "Heavy Industrial Electro-Hydraulic Power Unit", "Hydraulics", 1600.0, "unit", False),
            ("MOD-TCU-11", "5G Telematics Gateway & Cyber Security Node", "Connectivity", 420.0, "unit", False),
            ("MOD-BRAKE-12", "Integrated Electro-Hydraulic Braking System", "Braking", 790.0, "unit", True),
        ]

        materials_list = raw_materials + components + modules
        materials: Dict[str, Material] = {}
        for sku, name, cat, cost, uom, is_crit in materials_list:
            mat = Material(
                organization_id=self.org_id,
                sku=sku,
                name=name,
                category=cat,
                standard_cost=cost,
                unit_of_measure=uom,
                is_critical=is_crit
            )
            self.db.add(mat)
            materials[sku] = mat
        self.db.commit()

        # 4. Create 30 Multi-Tier Suppliers
        # Tier 3 (12 suppliers), Tier 2 (10 suppliers), Tier 1 (8 suppliers)
        suppliers_data = [
            # Tier 3 (Raw materials)
            ("Nippon Steel Mining & Metallurgy", "SUP-T3-01", "Tier 3", "Japan", "Nagoya", 2500.0, 88.0, 14, 42.0, 0.98, 0.15, 0.12, "RAW-STL-01"),
            ("Alcoa Global Ingot Works", "SUP-T3-02", "Tier 3", "USA", "Pittsburgh", 3000.0, 80.0, 7, 62.0, 0.95, 0.20, 0.18, "RAW-ALU-02"),
            ("Chilean Copper Refineries SA", "SUP-T3-03", "Tier 3", "Chile", "Santiago", 1800.0, 92.0, 21, 90.0, 0.92, 0.35, 0.28, "RAW-COP-03"),
            ("Shin-Etsu Silicon Crystals", "SUP-T3-04", "Tier 3", "Japan", "Shin-Etsu", 1200.0, 94.0, 18, 210.0, 0.99, 0.10, 0.15, "RAW-SIL-04"), # SPOF Candidate
            ("Baotou Rare Earth Group", "SUP-T3-05", "Tier 3", "China", "Baotou", 800.0, 96.0, 28, 360.0, 0.86, 0.45, 0.42, "RAW-REE-05"), # SPOF Candidate
            ("Albemarle Lithium Processing", "SUP-T3-06", "Tier 3", "USA", "Charlotte", 1400.0, 85.0, 10, 295.0, 0.94, 0.22, 0.20, "RAW-LIT-06"),
            ("Vale Nickel Operations", "SUP-T3-07", "Tier 3", "Canada", "Sudbury", 2000.0, 75.0, 12, 135.0, 0.96, 0.18, 0.15, "RAW-NIC-07"),
            ("Evonik Polymer Technologies", "SUP-T3-08", "Tier 3", "Germany", "Essen", 1600.0, 82.0, 8, 70.0, 0.97, 0.12, 0.10, "RAW-POL-08"),
            ("Toray Carbon Fibers", "SUP-T3-09", "Tier 3", "Japan", "Tokyo", 1100.0, 90.0, 16, 175.0, 0.98, 0.14, 0.16, "RAW-CAR-09"),
            ("Lanxess Synthetic Elastomers", "SUP-T3-10", "Tier 3", "Germany", "Cologne", 2200.0, 78.0, 9, 32.0, 0.95, 0.16, 0.14, "RAW-RUB-10"),
            ("TIMET Aerospace Titanium", "SUP-T3-11", "Tier 3", "USA", "Dallas", 900.0, 84.0, 14, 400.0, 0.93, 0.24, 0.22, "RAW-TIT-11"),
            ("Asahi Glass Automotive Corp", "SUP-T3-12", "Tier 3", "Japan", "Tokyo", 1700.0, 76.0, 15, 80.0, 0.97, 0.11, 0.12, "RAW-GLA-12"),

            # Tier 2 (Component specialists)
            ("Taiwan Microelectronics Foundry", "SUP-T2-01", "Tier 2", "Taiwan", "Hsinchu", 1500.0, 95.0, 21, 140.0, 0.96, 0.38, 0.35, "CMP-SEMI-01"), # Critical SPOF
            ("Infineon Power Systems", "SUP-T2-02", "Tier 2", "Germany", "Munich", 1800.0, 84.0, 10, 80.0, 0.98, 0.14, 0.12, "CMP-SEMI-02"),
            ("Bosch Sensortec Precision", "SUP-T2-03", "Tier 2", "Germany", "Reutlingen", 2000.0, 80.0, 8, 60.0, 0.99, 0.10, 0.11, "CMP-SNS-03"),
            ("Brembo High Performance Braking", "SUP-T2-04", "Tier 2", "Italy", "Bergamo", 1400.0, 86.0, 11, 115.0, 0.96, 0.19, 0.17, "CMP-BRK-04"),
            ("Yazaki Electrical Wiring Systems", "SUP-T2-05", "Tier 2", "Japan", "Shizuoka", 2200.0, 88.0, 16, 185.0, 0.94, 0.25, 0.22, "CMP-HAR-05"),
            ("Parker Hannifin Fluid Systems", "SUP-T2-06", "Tier 2", "USA", "Cleveland", 1300.0, 82.0, 7, 270.0, 0.97, 0.15, 0.14, "CMP-HYD-06"),
            ("Moog Precision Electro-Valves", "SUP-T2-07", "Tier 2", "USA", "East Aurora", 1600.0, 79.0, 8, 150.0, 0.96, 0.16, 0.15, "CMP-VLV-07"),
            ("Nidec Advanced Electric Motors", "SUP-T2-08", "Tier 2", "Japan", "Kyoto", 1700.0, 89.0, 17, 325.0, 0.97, 0.20, 0.18, "CMP-MOT-08"),
            ("Garrett Motion Turbo Technologies", "SUP-T2-09", "Tier 2", "Switzerland", "Rolle", 1100.0, 81.0, 9, 395.0, 0.95, 0.18, 0.16, "CMP-TRB-09"),
            ("Jabil Electronics Manufacturing", "SUP-T2-10", "Tier 2", "USA", "St. Petersburg", 2100.0, 83.0, 6, 215.0, 0.96, 0.17, 0.15, "CMP-ACT-10"),

            # Tier 1 (Direct Module Assemblers)
            ("Continental Autonomous Radar Systems", "SUP-T1-01", "Tier 1", "Germany", "Hanover", 800.0, 88.0, 9, 820.0, 0.98, 0.12, 0.14, "MOD-ADAS-01"), # Critical
            ("LG Energy Solution Gigafactory", "SUP-T1-02", "Tier 1", "South Korea", "Ochang", 950.0, 92.0, 19, 3100.0, 0.97, 0.28, 0.24, "MOD-BAT-02"), # Critical
            ("BorgWarner PowerDrive Systems", "SUP-T1-03", "Tier 1", "USA", "Auburn Hills", 1100.0, 82.0, 5, 1400.0, 0.97, 0.14, 0.13, "MOD-INV-03"),
            ("Magna International Chassis Group", "SUP-T1-04", "Tier 1", "Canada", "Aurora", 1300.0, 86.0, 6, 1100.0, 0.98, 0.12, 0.11, "MOD-CHAS-04"),
            ("Cummins Advanced Powertrains", "SUP-T1-05", "Tier 1", "USA", "Columbus", 750.0, 79.0, 5, 2700.0, 0.96, 0.15, 0.16, "MOD-ENG-05"),
            ("ZF Friedrichshafen Drivetrain", "SUP-T1-06", "Tier 1", "Germany", "Friedrichshafen", 900.0, 85.0, 8, 1800.0, 0.98, 0.13, 0.12, "MOD-GBX-06"),
            ("Nexteer Steer-by-Wire Global", "SUP-T1-07", "Tier 1", "USA", "Auburn Hills", 1000.0, 83.0, 6, 890.0, 0.97, 0.16, 0.15, "MOD-STEER-07"),
            ("Denso Integrated Thermal Systems", "SUP-T1-08", "Tier 1", "Japan", "Kariya", 1200.0, 80.0, 14, 650.0, 0.99, 0.10, 0.09, "MOD-COOL-08"),
        ]

        suppliers: Dict[str, Supplier] = {}
        for name, code, tier, country, city, cap, util, lt, cost, rel, fr, opr, mat_sku in suppliers_data:
            sup = Supplier(
                organization_id=self.org_id,
                name=name,
                code=code,
                tier=tier,
                country=country,
                city=city,
                daily_capacity=cap,
                current_utilization=util,
                lead_time_days=lt,
                unit_cost=cost,
                reliability_score=rel,
                financial_risk=fr,
                operational_risk=opr,
                status="ACTIVE",
                is_synthetic=True
            )
            self.db.add(sup)
            suppliers[code] = sup
        self.db.commit()

        # 5. Create 20 Finished Products
        products_data = [
            ("PRD-EV-PWR-01", "Apex Next-Gen 800V EV Powertrain", "Complete dual-motor 800V high-performance electric propulsion platform.", 8500.0, 45.0),
            ("PRD-ADAS-RAD-02", "Apex VisionGuard L3 Autonomous Radar Suite", "Integrated 77GHz long-range perception and imaging radar module.", 2400.0, 90.0),
            ("PRD-IND-HYD-03", "Apex Titan Industrial Hydraulic Power Station", "Heavy manufacturing electro-hydraulic flow station with smart diagnostics.", 6200.0, 25.0),
            ("PRD-TRK-GBX-04", "Apex DuraShift 8-Speed Heavy Truck Transmission", "High-torque commercial transmission with predictive shifting software.", 4900.0, 35.0),
            ("PRD-STEER-05", "Apex FlexDrive Redundant Steer-by-Wire Column", "Drive-by-wire steering actuator with ASIL-D functional safety certification.", 2100.0, 80.0),
            ("PRD-BAT-PACK-06", "Apex PowerCell 105kWh Heavy Fleet Battery", "Modular commercial vehicle battery pack with active liquid immersion cooling.", 12500.0, 20.0),
            ("PRD-HYB-ENG-07", "Apex EcoTorque 3.0L Turbo Hybrid Core", "High-efficiency variable-compression internal combustion powertrain module.", 7800.0, 30.0),
            ("PRD-BRK-DYN-08", "Apex BrakeMaster Electro-Hydraulic Dynamic Unit", "Integrated brake-by-wire and regenerative energy dissipation unit.", 1950.0, 85.0),
            ("PRD-IND-VLV-09", "Apex ProFlow Industrial Multi-Port Valve Bank", "Automated distribution manifold for severe industrial liquid process control.", 3100.0, 50.0),
            ("PRD-ACT-ROB-10", "Apex MegaTorque Heavy Robotic Joint Actuator", "Ultra-high-torque harmonic joint motor with integrated optical encoders.", 4200.0, 40.0),
            ("PRD-CHAS-EV-11", "Apex Skateboard EV Structural Rolling Chassis", "Modular aluminum-carbon composite chassis platform for electric vans.", 9600.0, 22.0),
            ("PRD-THERM-12", "Apex OmniCool Integrated Thermal Heat Pump", "Combined cabin climate and battery thermal management heat pump subsystem.", 1800.0, 75.0),
            ("PRD-INV-SIC-13", "Apex HyperVolt SiC Dual Traction Inverter", "Silicon carbide wide-bandgap high-voltage inverter for extreme power density.", 3600.0, 60.0),
            ("PRD-PDU-HV-14", "Apex SafeCharge Smart High-Voltage PDU", "Intelligent power junction with pyrotechnic safety isolation disconnect.", 1400.0, 110.0),
            ("PRD-TEL-5G-15", "Apex ConnectX 5G Edge Gateway & V2X Unit", "Ruggedized telemetry unit for real-time fleet diagnostics and over-the-air updates.", 1100.0, 130.0),
            ("PRD-TRB-AIR-16", "Apex AeroBoost High-Pressure Commercial Turbo", "Ceramic-bearing variable turbine for heavy industrial diesel and hydrogen engines.", 2650.0, 45.0),
            ("PRD-MOT-PER-17", "Apex MagForce 250kW Synchronous Stator Motor", "Permanent magnet motor assembly with hairpin winding architecture.", 4800.0, 50.0),
            ("PRD-RAD-AIR-18", "Apex HeavyDuty Copper-Alloy Core Radiator", "High-vibration resistant cooling core for mining and off-highway machinery.", 1250.0, 95.0),
            ("PRD-SNS-IMU-19", "Apex SafeNav Aerospace Grade 6-DOF IMU Sensor", "Precision inertial measurement unit for automated guided vehicles and drones.", 950.0, 150.0),
            ("PRD-HAR-HV-20", "Apex MegaShield 1000V High-Current Harness", "Flame-retardant electromagnetic shielded main busbar wiring assembly.", 850.0, 180.0),
        ]

        products: Dict[str, Product] = {}
        for sku, name, desc, price, demand in products_data:
            prd = Product(
                organization_id=self.org_id,
                sku=sku,
                name=name,
                description=desc,
                selling_price=price,
                target_daily_demand=demand
            )
            self.db.add(prd)
            products[sku] = prd
        self.db.commit()

        # 6. Create Multi-Level Bill of Materials (BOM)
        # Link products to modules and components
        bom_mappings = [
            ("PRD-EV-PWR-01", [("MOD-BAT-02", 1.0), ("MOD-INV-03", 1.0), ("MOD-COOL-08", 1.0), ("CMP-HAR-05", 2.0)]),
            ("PRD-ADAS-RAD-02", [("MOD-ADAS-01", 1.0), ("CMP-SEMI-01", 2.0), ("CMP-SNS-03", 1.0)]),
            ("PRD-IND-HYD-03", [("MOD-HYD-10", 1.0), ("CMP-HYD-06", 1.0), ("CMP-VLV-07", 3.0)]),
            ("PRD-TRK-GBX-04", [("MOD-GBX-06", 1.0), ("CMP-BEA-12", 4.0), ("RAW-STL-01", 25.0)]),
            ("PRD-STEER-05", [("MOD-STEER-07", 1.0), ("CMP-ACT-10", 1.0), ("CMP-SEMI-01", 1.0)]),
            ("PRD-BAT-PACK-06", [("MOD-BAT-02", 1.0), ("CMP-BMS-11", 4.0), ("RAW-LIT-06", 15.0), ("RAW-ALU-02", 30.0)]),
            ("PRD-HYB-ENG-07", [("MOD-ENG-05", 1.0), ("CMP-TRB-09", 1.0), ("CMP-INJ-15", 4.0)]),
            ("PRD-BRK-DYN-08", [("MOD-BRAKE-12", 1.0), ("CMP-BRK-04", 4.0), ("RAW-STL-01", 12.0)]),
            ("PRD-IND-VLV-09", [("CMP-VLV-07", 4.0), ("RAW-TIT-11", 5.0), ("RAW-RUB-10", 2.0)]),
            ("PRD-ACT-ROB-10", [("CMP-MOT-08", 1.0), ("CMP-BEA-12", 2.0), ("RAW-REE-05", 3.0)]),
            ("PRD-CHAS-EV-11", [("MOD-CHAS-04", 1.0), ("RAW-CAR-09", 8.0), ("RAW-ALU-02", 45.0)]),
            ("PRD-THERM-12", [("MOD-COOL-08", 1.0), ("CMP-RAD-14", 1.0), ("CMP-HYD-06", 1.0)]),
            ("PRD-INV-SIC-13", [("MOD-INV-03", 1.0), ("CMP-SEMI-02", 6.0), ("RAW-COP-03", 10.0)]),
            ("PRD-PDU-HV-14", [("MOD-PDU-09", 1.0), ("CMP-HAR-05", 1.0), ("RAW-COP-03", 8.0)]),
            ("PRD-TEL-5G-15", [("MOD-TCU-11", 1.0), ("CMP-SEMI-01", 1.0), ("RAW-SIL-04", 1.0)]),
            ("PRD-TRB-AIR-16", [("CMP-TRB-09", 1.0), ("RAW-TIT-11", 4.0), ("RAW-NIC-07", 6.0)]),
            ("PRD-MOT-PER-17", [("CMP-MOT-08", 1.0), ("RAW-REE-05", 4.0), ("RAW-COP-03", 12.0)]),
            ("PRD-RAD-AIR-18", [("CMP-RAD-14", 1.0), ("RAW-ALU-02", 18.0), ("RAW-COP-03", 6.0)]),
            ("PRD-SNS-IMU-19", [("CMP-SNS-03", 1.0), ("CMP-SEMI-01", 1.0), ("RAW-SIL-04", 1.0)]),
            ("PRD-HAR-HV-20", [("CMP-HAR-05", 2.0), ("RAW-COP-03", 22.0), ("RAW-POL-08", 5.0)]),
        ]

        for prd_sku, reqs in bom_mappings:
            prd = products.get(prd_sku)
            if not prd:
                continue
            for mat_sku, qty in reqs:
                mat = materials.get(mat_sku)
                if mat:
                    bom = BillOfMaterial(
                        organization_id=self.org_id,
                        product_id=prd.id,
                        material_id=mat.id,
                        quantity_required=qty
                    )
                    self.db.add(bom)
        self.db.commit()

        # 7. Create Supply Edges (Multi-Tier Flows)
        # Tier 3 -> Tier 2 -> Tier 1 -> Tier 0 (Plants) -> Downstream (DCs)
        edges_to_create = [
            # Tier 3 to Tier 2
            ("SUP-T3-01", "SUP-T2-04", "RAW-STL-01", 200.0, 10, 2.5, 90.0),
            ("SUP-T3-02", "SUP-T2-10", "RAW-ALU-02", 150.0, 7, 3.0, 85.0),
            ("SUP-T3-03", "SUP-T2-05", "RAW-COP-03", 300.0, 14, 4.0, 95.0),
            ("SUP-T3-04", "SUP-T2-01", "RAW-SIL-04", 250.0, 18, 5.0, 100.0), # SPOF dependency
            ("SUP-T3-05", "SUP-T2-08", "RAW-REE-05", 120.0, 24, 6.0, 100.0), # SPOF dependency
            ("SUP-T3-06", "SUP-T2-02", "RAW-LIT-06", 180.0, 10, 4.5, 90.0),
            ("SUP-T3-07", "SUP-T2-09", "RAW-NIC-07", 140.0, 11, 3.5, 80.0),
            ("SUP-T3-08", "SUP-T2-07", "RAW-POL-08", 190.0, 8, 2.8, 85.0),
            ("SUP-T3-09", "SUP-T2-10", "RAW-CAR-09", 110.0, 15, 5.5, 90.0),

            # Tier 2 to Tier 1
            ("SUP-T2-01", "SUP-T1-01", "CMP-SEMI-01", 160.0, 18, 4.5, 100.0), # Critical Path
            ("SUP-T2-02", "SUP-T1-03", "CMP-SEMI-02", 220.0, 9, 3.2, 90.0),
            ("SUP-T2-03", "SUP-T1-01", "CMP-SNS-03", 180.0, 8, 2.8, 95.0),
            ("SUP-T2-05", "SUP-T1-02", "CMP-HAR-05", 250.0, 14, 4.2, 85.0),
            ("SUP-T2-06", "SUP-T1-07", "CMP-HYD-06", 140.0, 7, 3.8, 90.0),
            ("SUP-T2-08", "SUP-T1-03", "CMP-MOT-08", 170.0, 16, 5.0, 95.0),

            # Tier 1 to Tier 0 Plants
            ("SUP-T1-01", "PLANT-DET", "MOD-ADAS-01", 90.0, 9, 8.5, 100.0),
            ("SUP-T1-01", "PLANT-STG", "MOD-ADAS-01", 80.0, 5, 4.0, 100.0),
            ("SUP-T1-02", "PLANT-DET", "MOD-BAT-02", 50.0, 18, 25.0, 95.0),
            ("SUP-T1-02", "PLANT-MTY", "MOD-BAT-02", 40.0, 20, 28.0, 90.0),
            ("SUP-T1-03", "PLANT-DET", "MOD-INV-03", 60.0, 5, 6.0, 95.0),
            ("SUP-T1-03", "PLANT-OHI", "MOD-INV-03", 55.0, 5, 5.5, 90.0),
            ("SUP-T1-04", "PLANT-DET", "MOD-CHAS-04", 45.0, 6, 9.0, 95.0),
            ("SUP-T1-05", "PLANT-OHI", "MOD-ENG-05", 50.0, 5, 12.0, 90.0),
            ("SUP-T1-06", "PLANT-STG", "MOD-GBX-06", 65.0, 7, 14.0, 95.0),
            ("SUP-T1-07", "PLANT-DET", "MOD-STEER-07", 85.0, 5, 6.5, 95.0),
            ("SUP-T1-08", "PLANT-TKO", "MOD-COOL-08", 75.0, 12, 8.0, 90.0),

            # Plants to Distribution Centers (Downstream)
            ("PLANT-DET", "DC-CHI", None, 300.0, 2, 3.0, 60.0),
            ("PLANT-STG", "DC-RTM", None, 250.0, 3, 3.5, 70.0),
            ("PLANT-TKO", "DC-SIN", None, 220.0, 4, 4.2, 65.0),
            ("PLANT-OHI", "DC-CHI", None, 280.0, 2, 2.5, 50.0),
            ("PLANT-MTY", "DC-CHI", None, 200.0, 4, 5.0, 55.0),
        ]

        for s_code, t_code, m_sku, qty, lt, cost, dep in edges_to_create:
            s_obj = suppliers.get(s_code) or facilities.get(s_code)
            t_obj = suppliers.get(t_code) or facilities.get(t_code)
            m_obj = materials.get(m_sku) if m_sku else None

            if s_obj and t_obj:
                s_type = "SUPPLIER" if isinstance(s_obj, Supplier) else "FACILITY"
                t_type = "SUPPLIER" if isinstance(t_obj, Supplier) else "FACILITY"
                edge = SupplyEdge(
                    organization_id=self.org_id,
                    source_type=s_type,
                    source_id=s_obj.id,
                    target_type=t_type,
                    target_id=t_obj.id,
                    material_id=m_obj.id if m_obj else None,
                    daily_supply_quantity=qty,
                    lead_time_days=lt,
                    transit_cost_per_unit=cost,
                    dependency_percentage=dep
                )
                self.db.add(edge)
        self.db.commit()

        # 8. Seed Initial Plant Inventories (Buffers for 14-21 days)
        for fac in facilities.values():
            if fac.facility_type == "PLANT":
                for mat in materials.values():
                    # 14 to 28 days of typical buffer
                    stock_qty = 800.0 if mat.is_critical else 1500.0
                    inv = Inventory(
                        organization_id=self.org_id,
                        facility_id=fac.id,
                        material_id=mat.id,
                        quantity_on_hand=stock_qty,
                        safety_stock=250.0 if mat.is_critical else 150.0,
                        reorder_point=500.0 if mat.is_critical else 300.0
                    )
                    self.db.add(inv)
        self.db.commit()

        # 9. Create 2 Default Disruption Scenarios for immediate out-of-the-box exploration
        # Scenario 1: Primary Microcontroller Supplier Shutdown (Taiwan MCU 21-day shutdown)
        tsmc_sup = suppliers.get("SUP-T2-01")
        if tsmc_sup:
            scen1 = DisruptionScenario(
                organization_id=self.org_id,
                name="Primary Semiconductor Foundry Complete Shutdown (21 Days)",
                description="Simulates a complete 21-day cessation of automotive radar MCU shipments from Taiwan Microelectronics due to regional fab outage.",
                horizon_days=60,
                status="READY"
            )
            self.db.add(scen1)
            self.db.flush()

            ev1 = DisruptionEvent(
                scenario_id=scen1.id,
                entity_type="SUPPLIER",
                entity_id=tsmc_sup.id,
                disruption_type="SHUTDOWN",
                start_day=5,
                duration_days=21,
                capacity_reduction_pct=100.0,
                extra_lead_time_days=0,
                notes="Taiwan fab power grid outage halting 40nm MCU production line."
            )
            self.db.add(ev1)

        # Scenario 2: Global Rare Earth Export Restriction & Port Congestion
        rare_sup = suppliers.get("SUP-T3-05")
        if rare_sup:
            scen2 = DisruptionScenario(
                organization_id=self.org_id,
                name="Rare Earth Supply Cut 50% with Transpacific Port Delay",
                description="Models a 50% capacity curtailment on Neodymium magnets coupled with a 14-day port transit surge affecting Detroit and Ohio assembly lines.",
                horizon_days=60,
                status="READY"
            )
            self.db.add(scen2)
            self.db.flush()

            ev2a = DisruptionEvent(
                scenario_id=scen2.id,
                entity_type="SUPPLIER",
                entity_id=rare_sup.id,
                disruption_type="CAPACITY_REDUCTION",
                start_day=3,
                duration_days=30,
                capacity_reduction_pct=50.0,
                extra_lead_time_days=0,
                notes="Export quota reduction on magnetic raw materials."
            )
            self.db.add(ev2a)

        self.db.commit()
        return {
            "organization_id": self.org_id,
            "facilities_count": len(facilities_data),
            "materials_count": len(materials_list),
            "suppliers_count": len(suppliers_data),
            "products_count": len(products_data),
            "status": "SUCCESS"
        }
