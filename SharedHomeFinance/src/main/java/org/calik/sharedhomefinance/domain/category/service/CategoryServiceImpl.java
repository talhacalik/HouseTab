package org.calik.sharedhomefinance.domain.category.service;

import lombok.RequiredArgsConstructor;
import org.calik.sharedhomefinance.common.exception.BusinessException;
import org.calik.sharedhomefinance.common.exception.ForbiddenException;
import org.calik.sharedhomefinance.common.exception.ResourceNotFoundException;
import org.calik.sharedhomefinance.domain.category.dto.CategoryResponse;
import org.calik.sharedhomefinance.domain.category.dto.CreateCategoryRequest;
import org.calik.sharedhomefinance.domain.category.entity.Category;
import org.calik.sharedhomefinance.domain.category.repository.CategoryRepository;
import org.calik.sharedhomefinance.domain.home.entity.Home;
import org.calik.sharedhomefinance.domain.home.service.HomeService;
import org.calik.sharedhomefinance.domain.user.entity.User;
import org.calik.sharedhomefinance.domain.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final HomeService homeService;
    private final UserService userService;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAvailableCategories(String firebaseUid, Long homeId) {
        User user = userService.getByFirebaseUid(firebaseUid);
        homeService.validateMembership(homeId, user.getId());

        return categoryRepository.findAllAvailableForHome(homeId)
                .stream()
                .map(CategoryResponse::from)
                .toList();
    }

    @Override
    @Transactional
    public CategoryResponse createCustomCategory(String firebaseUid, Long homeId,
                                                 CreateCategoryRequest request) {
        User user = userService.getByFirebaseUid(firebaseUid);
        homeService.validateOwnership(homeId, user.getId());
        Home home = homeService.getHomeById(homeId);

        if (categoryRepository.existsByNameAndHomeId(request.name(), homeId)) {
            throw new BusinessException(
                    "Bu isimde bir kategori bu evde zaten mevcut.",
                    "CATEGORY_ALREADY_EXISTS"
            );
        }

        Category category = Category.builder()
                .name(request.name())
                .icon(request.icon())
                .home(home)
                .build();

        return CategoryResponse.from(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public void deleteCustomCategory(String firebaseUid, Long homeId, Long categoryId) {
        User user = userService.getByFirebaseUid(firebaseUid);
        homeService.validateOwnership(homeId, user.getId());

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Kategori", categoryId));

        if (category.isSystemCategory()) {
            throw new BusinessException(
                    "Sistem kategorileri silinemez.",
                    "SYSTEM_CATEGORY_IMMUTABLE"
            );
        }

        if (!category.getHome().getId().equals(homeId)) {
            throw new ForbiddenException("Bu kategori bu eve ait değil.");
        }

        categoryRepository.delete(category);
    }

    @Override
    @Transactional(readOnly = true)
    public Category getCategoryByIdAndHome(Long categoryId, Long homeId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Kategori", categoryId));

        // Sistem kategorisi → tüm evlere açık
        if (category.isSystemCategory()) {
            return category;
        }

        // Eve özel kategori → sadece o ev kullanabilir
        if (!category.getHome().getId().equals(homeId)) {
            throw new ForbiddenException("Bu kategori bu eve ait değil.");
        }

        return category;
    }
}