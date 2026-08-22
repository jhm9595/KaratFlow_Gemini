package com.minibig.karatflow.backend.web;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Throwable.class)
    public ResponseEntity<Map<String, Object>> handleAll(Throwable e) {
        StringWriter sw = new StringWriter();
        e.printStackTrace(new PrintWriter(sw));
        System.err.println("GLOBAL EXCEPTION: " + sw.toString());
        return ResponseEntity.status(500).body(Map.of("error_caught", e.getClass().getName(), "msg", String.valueOf(e.getMessage()), "stack", sw.toString()));
    }
}
