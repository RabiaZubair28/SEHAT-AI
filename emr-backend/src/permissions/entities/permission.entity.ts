import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Role } from '../../roles/entities/role.entity';
import { UserPermission } from '../../user-permissions/entities/user-permission.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsObject } from 'class-validator';

@Entity('permissions')
@Index('idx_permissions_role_id', ['role'])
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Role, (role) => role.permissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @OneToMany(
    () => UserPermission,
    (userPermission) => userPermission.permission,
  )
  userPermissions: UserPermission[];

  @ApiProperty({
    description: 'The specific permission payload as an array of objects',
    example: [{ name: 'John Doe' }, { name: 'Jane Doe' }],
    type: 'array',
  })
  @Column({ type: 'jsonb', nullable: true })
  @IsArray()
  @IsObject({ each: true })
  payload: Record<string, any>[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
