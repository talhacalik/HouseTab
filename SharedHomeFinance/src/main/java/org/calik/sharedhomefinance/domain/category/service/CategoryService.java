package org.calik.sharedhomefinance.domain.category.service;

import org.calik.sharedhomefinance.domain.category.dto.CategoryResponse;
import org.calik.sharedhomefinance.domain.category.dto.CreateCategoryRequest;
import org.calik.sharedhomefinance.domain.category.entity.Category;

import java.util.List;

public interface CategoryService {

    /** Sistem + o evin özel kategorilerini birlikte döner. */
    List<CategoryResponse> getAvailableCategories(String firebaseUid, Long homeId);

    /** OWNER, o eve özel yeni kategori oluşturur. */
    CategoryResponse createCustomCategory(String firebaseUid, Long homeId, CreateCategoryRequest request);

    /** OWNER, o eve özel bir kategoriyi siler. Sistem kategorisi silinemez. */
    void deleteCustomCategory(String firebaseUid, Long homeId, Long categoryId);

    /** Diğer domain'lerin iç kullanımı — entity döner, üyelik kontrolü yapar. */
    Category getCategoryByIdAndHome(Long categoryId, Long homeId);
}