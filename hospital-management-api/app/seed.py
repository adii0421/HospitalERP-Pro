"""
Seed script - populates the SQLite database with realistic sample data
across every module so the frontend has something meaningful to show
immediately after setup.

Usage:
    python -m app.seed
"""
from datetime import date, datetime, timedelta, timezone

from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models.appointment import Appointment
from app.models.billing import Invoice, InvoiceItem, Payment
from app.models.department import Department
from app.models.doctor import Doctor, DoctorSchedule
from app.models.enums import (
    AppointmentStatus,
    EmploymentType,
    Gender,
    InvoiceStatus,
    LabTestStatus,
    PaymentMethod,
    PrescriptionStatus,
    StaffStatus,
    UserRole,
)
from app.models.inventory import InventoryCategory, InventoryItem
from app.models.laboratory import LabTest, LabTestOrder
from app.models.patient import Patient
from app.models.pharmacy import Medicine, Prescription, PrescriptionItem
from app.models.staff import Staff
from app.models.user import User


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            print("Database already seeded. Skipping.")
            return

        now = datetime.now(timezone.utc)

        # --- Users ---
        admin = User(
            full_name="Administrator",
            email="admin@hospital.com",
            hashed_password=hash_password("Admin@123"),
            role=UserRole.ADMIN,
            phone="9000000001",
        )
        receptionist = User(
            full_name="Priya Sharma",
            email="reception@hospital.com",
            hashed_password=hash_password("Reception@123"),
            role=UserRole.RECEPTIONIST,
            phone="9000000002",
        )
        db.add_all([admin, receptionist])
        db.commit()

        # --- Departments ---
        dept_names = [
            ("Cardiology", "Heart and cardiovascular care", "Block A, Floor 2"),
            ("Neurology", "Brain and nervous system", "Block A, Floor 3"),
            ("Orthopedics", "Bones, joints and muscles", "Block B, Floor 1"),
            ("Pediatrics", "Child healthcare", "Block B, Floor 2"),
            ("General Medicine", "General consultations", "Block A, Floor 1"),
        ]
        departments = []
        for name, desc, loc in dept_names:
            d = Department(name=name, description=desc, location=loc, phone_extension="100")
            db.add(d)
            departments.append(d)
        db.commit()

        # --- Doctors ---
        doctor_data = [
            ("Dr. Anil Kapoor", "anil.kapoor@hospital.com", "Cardiologist", departments[0], 900.0, 12),
            ("Dr. Meera Nair", "meera.nair@hospital.com", "Neurologist", departments[1], 1000.0, 9),
            ("Dr. Rohan Verma", "rohan.verma@hospital.com", "Orthopedic Surgeon", departments[2], 850.0, 15),
            ("Dr. Sana Khan", "sana.khan@hospital.com", "Pediatrician", departments[3], 700.0, 7),
            ("Dr. Vikram Singh", "vikram.singh@hospital.com", "General Physician", departments[4], 500.0, 5),
        ]
        doctors = []
        for i, (name, email, spec, dept, fee, exp) in enumerate(doctor_data):
            doc = Doctor(
                full_name=name,
                email=email,
                phone=f"90000001{i:02d}",
                specialization=spec,
                qualification="MBBS, MD",
                license_number=f"LIC-{1000 + i}",
                years_of_experience=exp,
                consultation_fee=fee,
                department_id=dept.id,
                is_available=True,
            )
            db.add(doc)
            doctors.append(doc)
        db.commit()

        for doc in doctors:
            for day in range(0, 5):
                db.add(
                    DoctorSchedule(
                        doctor_id=doc.id,
                        day_of_week=day,
                        start_time=datetime.strptime("09:00", "%H:%M").time(),
                        end_time=datetime.strptime("17:00", "%H:%M").time(),
                        slot_duration_minutes=30,
                    )
                )
        db.commit()

        # --- Patients ---
        patient_data = [
            ("Ramesh Gupta", date(1985, 4, 12), Gender.MALE, "O+"),
            ("Sunita Devi", date(1990, 8, 23), Gender.FEMALE, "A+"),
            ("Arjun Mehta", date(2001, 1, 5), Gender.MALE, "B+"),
            ("Kavya Reddy", date(1978, 11, 30), Gender.FEMALE, "AB+"),
            ("Farhan Ali", date(1995, 6, 18), Gender.MALE, "O-"),
            ("Neha Joshi", date(2010, 3, 9), Gender.FEMALE, "A-"),
        ]
        patients = []
        for i, (name, dob, gender, bg) in enumerate(patient_data):
            p = Patient(
                patient_code=f"PT-{i + 1:05d}",
                full_name=name,
                date_of_birth=dob,
                gender=gender,
                blood_group=bg,
                phone=f"98765432{i:02d}",
                email=f"{name.split()[0].lower()}@example.com",
                address="Pune, Maharashtra",
                emergency_contact_name="Family Member",
                emergency_contact_phone="9876500000",
            )
            db.add(p)
            patients.append(p)
        db.commit()

        # --- Appointments ---
        statuses = [
            AppointmentStatus.COMPLETED,
            AppointmentStatus.SCHEDULED,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.COMPLETED,
            AppointmentStatus.CANCELLED,
        ]
        appointments = []
        for i in range(10):
            patient = patients[i % len(patients)]
            doctor = doctors[i % len(doctors)]
            appt = Appointment(
                patient_id=patient.id,
                doctor_id=doctor.id,
                scheduled_at=now - timedelta(days=5 - (i % 5), hours=i),
                duration_minutes=30,
                reason="Routine checkup" if i % 2 == 0 else "Follow-up consultation",
                status=statuses[i % len(statuses)],
            )
            db.add(appt)
            appointments.append(appt)
        db.commit()

        # --- Billing ---
        for i, patient in enumerate(patients[:4]):
            invoice = Invoice(
                invoice_number=f"INV-{i + 1:06d}",
                patient_id=patient.id,
                issue_date=now - timedelta(days=i),
                due_date=now + timedelta(days=15 - i),
                tax_amount=50.0,
                discount_amount=0.0,
                status=InvoiceStatus.PENDING,
            )
            db.add(invoice)
            db.commit()
            item = InvoiceItem(
                invoice_id=invoice.id,
                description="Consultation Fee",
                category="consultation",
                quantity=1,
                unit_price=doctors[i % len(doctors)].consultation_fee,
                total_price=doctors[i % len(doctors)].consultation_fee,
            )
            db.add(item)
            invoice.subtotal = item.total_price
            invoice.total_amount = round(invoice.subtotal + invoice.tax_amount, 2)
            if i == 0:
                payment = Payment(
                    invoice_id=invoice.id, amount=invoice.total_amount, method=PaymentMethod.CASH
                )
                db.add(payment)
                invoice.amount_paid = invoice.total_amount
                invoice.status = InvoiceStatus.PAID
            db.add(invoice)
            db.commit()

        # --- Pharmacy ---
        medicine_data = [
            ("Paracetamol 500mg", "Acetaminophen", "analgesic", 2.5, 500, 50),
            ("Amoxicillin 250mg", "Amoxicillin", "antibiotic", 6.0, 200, 30),
            ("Cetirizine 10mg", "Cetirizine", "antihistamine", 3.0, 300, 40),
            ("Metformin 500mg", "Metformin", "antidiabetic", 4.5, 15, 20),
            ("Atorvastatin 10mg", "Atorvastatin", "statin", 8.0, 8, 15),
        ]
        medicines = []
        for name, generic, cat, price, stock, reorder in medicine_data:
            m = Medicine(
                name=name,
                generic_name=generic,
                category=cat,
                manufacturer="Generic Pharma Ltd.",
                unit="tablet",
                unit_price=price,
                stock_quantity=stock,
                reorder_level=reorder,
                expiry_date=date.today() + timedelta(days=365),
                batch_number="BATCH-001",
            )
            db.add(m)
            medicines.append(m)
        db.commit()

        prescription = Prescription(
            patient_id=patients[0].id,
            doctor_id=doctors[0].id,
            diagnosis="Seasonal flu with mild fever",
            status=PrescriptionStatus.PENDING,
        )
        db.add(prescription)
        db.commit()
        db.add(
            PrescriptionItem(
                prescription_id=prescription.id,
                medicine_id=medicines[0].id,
                dosage="1 tablet",
                frequency="Twice a day",
                duration_days=5,
                quantity=10,
                instructions="Take after food",
            )
        )
        db.commit()

        # --- Laboratory ---
        lab_test_data = [
            ("Complete Blood Count", "hematology", "blood", 300.0, 6, "4.5-11 x10^9/L"),
            ("Lipid Profile", "biochemistry", "blood", 500.0, 12, "Total cholesterol < 200 mg/dL"),
            ("Chest X-Ray", "radiology", "n/a", 400.0, 2, "N/A"),
            ("Urinalysis", "pathology", "urine", 200.0, 4, "N/A"),
        ]
        lab_tests = []
        for name, cat, sample, price, hrs, rng in lab_test_data:
            t = LabTest(
                name=name, category=cat, sample_type=sample, price=price, turnaround_hours=hrs, normal_range=rng
            )
            db.add(t)
            lab_tests.append(t)
        db.commit()

        db.add(
            LabTestOrder(
                patient_id=patients[1].id,
                doctor_id=doctors[1].id,
                lab_test_id=lab_tests[0].id,
                status=LabTestStatus.ORDERED,
            )
        )
        db.commit()

        # --- Inventory ---
        inventory_data = [
            ("Surgical Gloves (Box)", InventoryCategory.CONSUMABLE, "SKU-GLV-001", 5.0, 100, 20),
            ("Digital Thermometer", InventoryCategory.EQUIPMENT, "SKU-EQP-002", 15.0, 25, 5),
            ("Syringes 5ml (Pack)", InventoryCategory.CONSUMABLE, "SKU-SYR-003", 3.0, 8, 10),
            ("ECG Machine", InventoryCategory.DIAGNOSTIC, "SKU-DIA-004", 45000.0, 3, 1),
        ]
        for name, cat, sku, cost, qty, reorder in inventory_data:
            db.add(
                InventoryItem(
                    name=name,
                    category=cat,
                    sku=sku,
                    unit="unit",
                    unit_cost=cost,
                    quantity_in_stock=qty,
                    reorder_level=reorder,
                    supplier="MedSupply Co.",
                    location="Central Store",
                )
            )
        db.commit()

        # --- Staff ---
        staff_data = [
            ("Anita Deshmukh", "anita.d@hospital.com", "Head Nurse", departments[0], 45000.0),
            ("Suresh Pawar", "suresh.p@hospital.com", "Lab Technician", departments[4], 30000.0),
            ("Kiran Patil", "kiran.p@hospital.com", "Receptionist", departments[4], 25000.0),
            ("Rahul Jadhav", "rahul.j@hospital.com", "Pharmacist", departments[4], 32000.0),
        ]
        for name, email, designation, dept, salary in staff_data:
            db.add(
                Staff(
                    full_name=name,
                    email=email,
                    phone="9988776600",
                    designation=designation,
                    department_id=dept.id,
                    employment_type=EmploymentType.FULL_TIME,
                    status=StaffStatus.ACTIVE,
                    date_joined=date(2022, 1, 1),
                    salary=salary,
                )
            )
        db.commit()

        print("Database seeded successfully.")
        print("Admin login: admin@hospital.com / Admin@123")
        print("Receptionist login: reception@hospital.com / Reception@123")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
