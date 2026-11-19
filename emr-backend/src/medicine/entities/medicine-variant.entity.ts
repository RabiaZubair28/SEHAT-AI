import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Medicine } from "./medicine.entity";
import { MedicineUnit } from "src/common/enums/enums";
import { MedicineBatch } from "./medicine-batch.entity";
import { DispenseItem } from "src/dispenser/entities/dispense-item.entity";
import { MedicineCount } from "src/medicine-batch/entities/medicine-count.entity";

@Entity('medicine_variants')
export class MedicineVariant {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Medicine, (medicine) => medicine.variants, {
        onDelete: 'CASCADE',
        eager: true,
    })
    @JoinColumn({ name: 'medicine_id' })
    medicine: Medicine;

    @Column({ length: 300 })
    strength: string;

    @Column({
        type: 'enum',
        enum: MedicineUnit,
    })
    unit: MedicineUnit;

    @OneToMany(() => MedicineBatch, (batch) => batch.variant)
    batches: MedicineBatch[];

    @OneToMany(() => DispenseItem, (item) => item.batch)
    dispenseItems: DispenseItem[];

    @OneToMany(() => MedicineCount, (medicineCount) => medicineCount.medicineVariant)
    medicineCount: MedicineCount;
}
