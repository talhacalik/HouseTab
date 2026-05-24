package org.calik.sharedhomefinance.config;

import lombok.RequiredArgsConstructor;
import org.calik.sharedhomefinance.domain.category.entity.Category;
import org.calik.sharedhomefinance.domain.category.repository.CategoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final CategoryRepository categoryRepository;

    private record SystemCategory(String name, String icon) {}

    private static final List<SystemCategory> SYSTEM_CATEGORIES = List.of(
            new SystemCategory("Market",    "🛒"),
            new SystemCategory("Kira",      "🏠"),
            new SystemCategory("Fatura",    "📄"),
            new SystemCategory("Yemek",     "🍽️"),
            new SystemCategory("Temizlik",  "🧹"),
            new SystemCategory("Ulaşım",    "🚌"),
            new SystemCategory("Eğlence",   "🎮"),
            new SystemCategory("Diğer",     "📦")
    );

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        int created = 0;

        for (SystemCategory sc : SYSTEM_CATEGORIES) {
            if (!categoryRepository.existsByNameAndHomeIsNull(sc.name())) {
                categoryRepository.save(
                        Category.builder()
                                .name(sc.name())
                                .icon(sc.icon())
                                .home(null)
                                .build()
                );
                created++;
            }
        }

        if (created > 0) {
            log.info("{} sistem kategorisi oluşturuldu.", created);
        } else {
            log.info("Sistem kategorileri zaten mevcut, atlandı.");
        }
    }
}