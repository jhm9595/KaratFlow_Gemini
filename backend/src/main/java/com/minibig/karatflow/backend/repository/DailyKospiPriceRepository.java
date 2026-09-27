package com.minibig.karatflow.backend.repository;

import com.minibig.karatflow.backend.domain.DailyKospiPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.Optional;
import java.util.List;

public interface DailyKospiPriceRepository extends JpaRepository<DailyKospiPrice, Long> {
    Optional<DailyKospiPrice> findByDate(LocalDate date);
    Optional<DailyKospiPrice> findFirstByOrderByDateDesc();
    List<DailyKospiPrice> findAllByOrderByDateAsc();
    List<DailyKospiPrice> findTop7ByOrderByDateDesc();
}