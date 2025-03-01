import { Request, Response } from 'express';
import { Pool } from 'mysql2/promise';
import { RowDataPacket } from 'mysql2';

interface Role extends RowDataPacket {
  id: number;
  name: string;
  permissions: string;
  description: string;
  created_at: Date;
  updated_at: Date;
}

export class RoleController {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createRole(req: Request, res: Response) {
    const { name, permissions, description } = req.body;
    try {
      const [result] = await this.pool.query(
        'INSERT INTO roles (name, permissions, description) VALUES (?, ?, ?)',
        [name, JSON.stringify(permissions), description]
      );
      res.status(201).json({ message: '角色创建成功', id: result });
    } catch (error: any) {
      res.status(500).json({ error: '创建角色失败', details: error.message });
    }
  }

  async getRoles(req: Request, res: Response) {
    try {
      const [roles] = await this.pool.query<Role[]>('SELECT * FROM roles');
      res.json(roles);
    } catch (error: any) {
      res.status(500).json({ error: '获取角色列表失败', details: error.message });
    }
  }

  async updateRole(req: Request, res: Response) {
    const { id } = req.params;
    const { name, permissions, description } = req.body;
    try {
      await this.pool.query(
        'UPDATE roles SET name = ?, permissions = ?, description = ? WHERE id = ?',
        [name, JSON.stringify(permissions), description, id]
      );
      res.json({ message: '角色更新成功' });
    } catch (error: any) {
      res.status(500).json({ error: '更新角色失败', details: error.message });
    }
  }

  async deleteRole(req: Request, res: Response) {
    const { id } = req.params;
    try {
      await this.pool.query('DELETE FROM roles WHERE id = ?', [id]);
      res.json({ message: '角色删除成功' });
    } catch (error: any) {
      res.status(500).json({ error: '删除角色失败', details: error.message });
    }
  }
}

export function createRoleRoutes(controller: RoleController) {
  return {
    createRole: (req: Request, res: Response) => controller.createRole(req, res),
    getRoles: (req: Request, res: Response) => controller.getRoles(req, res),
    updateRole: (req: Request, res: Response) => controller.updateRole(req, res),
    deleteRole: (req: Request, res: Response) => controller.deleteRole(req, res)
  };
} 