package com.minibig.karatflow.backend.repository;

import com.minibig.karatflow.backend.domain.DailyMetalPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.Optional;

public interface DailyMetalPriceRepository extends JpaRepository<DailyMetalPrice, Long> {
    Optional<DailyMetalPrice> findByPriceDateAndMetalType(LocalDate date, String metalType);
    Optional<DailyMetalPrice> findFirstByMetalTypeOrderByPriceDateDesc(String metalType);
    java.util.List<DailyMetalPrice> findTop7ByMetalTypeOrderByPriceDateDesc(String metalType);
}
