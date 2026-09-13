package com.minibig.karatflow.backend.domain;
import jakarta.persistence.*;
import java.time.LocalDate;
@Entity
public class DailyPetroleumPrice {
@Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
private LocalDate date;
private Double gasolinePrice;
private Double dieselPrice;
private Double kerosenePrice;
public void setDate(LocalDate date) { this.date = date; }
public void setGasolinePrice(Double p) { this.gasolinePrice = p; }
public void setDieselPrice(Double p) { this.dieselPrice = p; }
public void setKerosenePrice(Double p) { this.kerosenePrice = p; }
public LocalDate getDate() { return date; }
public Double getGasolinePrice() { return gasolinePrice; }
public Double getDieselPrice() { return dieselPrice; }
public Double getKerosenePrice() { return kerosenePrice; }
}