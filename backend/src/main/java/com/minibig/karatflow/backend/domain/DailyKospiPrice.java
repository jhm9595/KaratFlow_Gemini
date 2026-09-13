package com.minibig.karatflow.backend.domain;
import jakarta.persistence.*;
import java.time.LocalDate;
@Entity
public class DailyKospiPrice {
@Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
private LocalDate date;
private Double kospiIndex;
private Double kospi200Index;
private Long tradingValue;
public void setDate(LocalDate date) { this.date = date; }
public void setKospiIndex(Double i) { this.kospiIndex = i; }
public void setKospi200Index(Double i) { this.kospi200Index = i; }
public void setTradingValue(Long v) { this.tradingValue = v; }
public LocalDate getDate() { return date; }
public Double getKospiIndex() { return kospiIndex; }
public Double getKospi200Index() { return kospi200Index; }
public Long getTradingValue() { return tradingValue; }
}