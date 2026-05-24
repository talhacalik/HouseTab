package org.calik.sharedhomefinance.ai;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MonthlyReportRepository extends JpaRepository<MonthlyReport, Long> {

    Optional<MonthlyReport> findByHomeIdAndYearAndMonthAndLanguage(
            Long homeId, int year, int month, String language);

    List<MonthlyReport> findAllByHomeIdOrderByYearDescMonthDesc(Long homeId);
}
