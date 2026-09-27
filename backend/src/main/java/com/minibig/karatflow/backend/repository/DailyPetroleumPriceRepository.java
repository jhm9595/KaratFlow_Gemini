package com.minibig.karatflow.backend.repository;

import com.minibig.karatflow.backend.domain.DailyPetroleumPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.Optional;
import java.util.List;

public interface DailyPetroleumPriceRepository extends JpaRepository<DailyPetroleumPrice, Long> {
    Optional<DailyPetroleumPrice> findByDate(LocalDate date);
    Optional<DailyPetroleumPrice> findFirstByOrderByDateDesc();
    Optional<DailyPetroleumPrice> findFirstByOrderByDateAsc();
    List<DailyPetroleumPrice> findAllByOrderByDateAsc();
    List<DailyPetroleumPrice> findTop7ByOrderByDateDesc();
}