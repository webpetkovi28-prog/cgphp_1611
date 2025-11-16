import { supabase } from '../lib/supabaseClient';
import type { Database } from '../lib/supabaseClient';

type Property = Database['public']['Tables']['properties']['Row'];
type PropertyInsert = Database['public']['Tables']['properties']['Insert'];
type PropertyUpdate = Database['public']['Tables']['properties']['Update'];
type PropertyImage = Database['public']['Tables']['property_images']['Row'];

class SupabaseService {
  // Properties
  async getProperties(filters?: any, page: number = 1, limit: number = 16) {
    try {
      let query = supabase
        .from('properties')
        .select(`
          *,
          images:property_images(*)
        `)
        .eq('active', true)
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.keyword) {
        query = query.or(`title.ilike.%${filters.keyword}%,description.ilike.%${filters.keyword}%,district.ilike.%${filters.keyword}%`);
      }
      
      if (filters?.transaction_type) {
        query = query.eq('transaction_type', filters.transaction_type);
      }
      
      if (filters?.city_region) {
        query = query.eq('city_region', filters.city_region);
      }
      
      if (filters?.property_type) {
        query = query.eq('property_type', filters.property_type);
      }
      
      if (filters?.district) {
        query = query.eq('district', filters.district);
      }
      
      if (filters?.featured === 'true') {
        query = query.eq('featured', true);
      }
      
      if (filters?.price_min) {
        query = query.gte('price', parseFloat(filters.price_min));
      }
      
      if (filters?.price_max) {
        query = query.lte('price', parseFloat(filters.price_max));
      }
      
      if (filters?.area_min) {
        query = query.gte('area', parseFloat(filters.area_min));
      }
      
      if (filters?.area_max) {
        query = query.lte('area', parseFloat(filters.area_max));
      }

      // Pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      const { data, error, count } = await query
        .range(from, to)
        .limit(limit);

      if (error) {
        console.error('Supabase error:', error);
        return { success: false, error: error.message };
      }

      const total = count || 0;
      const pages = Math.ceil(total / limit);

      return {
        success: true,
        data: data || [],
        meta: {
          page,
          limit,
          total,
          pages,
          hasPrev: page > 1,
          hasNext: page < pages
        }
      };
    } catch (error) {
      console.error('Error fetching properties:', error);
      return { success: false, error: 'Failed to fetch properties' };
    }
  }

  async getProperty(id: string) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          images:property_images(*)
        `)
        .eq('id', id)
        .eq('active', true)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching property:', error);
      return { success: false, error: 'Failed to fetch property' };
    }
  }

  async createProperty(propertyData: PropertyInsert) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .insert(propertyData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error creating property:', error);
      return { success: false, error: 'Failed to create property' };
    }
  }

  async updateProperty(id: string, updates: PropertyUpdate) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating property:', error);
      return { success: false, error: 'Failed to update property' };
    }
  }

  async deleteProperty(id: string) {
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting property:', error);
      return { success: false, error: 'Failed to delete property' };
    }
  }

  // Property Images
  async uploadPropertyImage(propertyId: string, imageUrl: string, isMain: boolean = false, sortOrder: number = 0) {
    try {
      // If this is set as main, unset all other main images first
      if (isMain) {
        await supabase
          .from('property_images')
          .update({ is_main: false })
          .eq('property_id', propertyId);
      }

      const { data, error } = await supabase
        .from('property_images')
        .insert({
          property_id: propertyId,
          image_url: imageUrl,
          is_main: isMain,
          sort_order: sortOrder
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error uploading image:', error);
      return { success: false, error: 'Failed to upload image' };
    }
  }

  async setMainImage(propertyId: string, imageId: string) {
    try {
      // First, unset all main images for this property
      await supabase
        .from('property_images')
        .update({ is_main: false })
        .eq('property_id', propertyId);

      // Then set the specified image as main
      const { error } = await supabase
        .from('property_images')
        .update({ is_main: true })
        .eq('id', imageId)
        .eq('property_id', propertyId);

      if (error) {
        console.error('Supabase error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error setting main image:', error);
      return { success: false, error: 'Failed to set main image' };
    }
  }

  async deletePropertyImage(imageId: string) {
    try {
      const { error } = await supabase
        .from('property_images')
        .delete()
        .eq('id', imageId);

      if (error) {
        console.error('Supabase error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting image:', error);
      return { success: false, error: 'Failed to delete image' };
    }
  }

  // Pages
  async getPages(activeOnly: boolean = true) {
    try {
      let query = supabase
        .from('pages')
        .select('*')
        .order('title');

      if (activeOnly) {
        query = query.eq('active', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching pages:', error);
      return { success: false, error: 'Failed to fetch pages' };
    }
  }

  async getPageBySlug(slug: string) {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('slug', slug)
        .eq('active', true)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching page:', error);
      return { success: false, error: 'Failed to fetch page' };
    }
  }

  // Services
  async getServices(activeOnly: boolean = true) {
    try {
      let query = supabase
        .from('services')
        .select('*')
        .order('sort_order');

      if (activeOnly) {
        query = query.eq('active', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching services:', error);
      return { success: false, error: 'Failed to fetch services' };
    }
  }

  // Statistics
  async getPropertyStats() {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, active, featured, transaction_type');

      if (error) {
        console.error('Supabase error:', error);
        return { success: false, error: error.message };
      }

      const stats = {
        totalProperties: data?.length || 0,
        activeProperties: data?.filter(p => p.active).length || 0,
        featuredProperties: data?.filter(p => p.featured).length || 0,
        saleProperties: data?.filter(p => p.transaction_type === 'sale').length || 0,
        rentProperties: data?.filter(p => p.transaction_type === 'rent').length || 0
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching stats:', error);
      return { success: false, error: 'Failed to fetch statistics' };
    }
  }
}

export const supabaseService = new SupabaseService();