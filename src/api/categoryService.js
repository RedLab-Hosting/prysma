import { BaseService } from './baseService';

class CategoryService extends BaseService {
  constructor(tenantId = null) {
    super('categories', tenantId);
  }
}

export const categoryService = new CategoryService();
