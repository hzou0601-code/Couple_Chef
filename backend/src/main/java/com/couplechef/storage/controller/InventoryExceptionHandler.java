package com.couplechef.storage.controller;

import com.couplechef.storage.service.InventoryException;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice(assignableTypes = StorageController.class)
public class InventoryExceptionHandler {
    public record ErrorBody(boolean success, String message, Object data, String code) {}

    @ExceptionHandler(InventoryException.class)
    public ResponseEntity<ErrorBody> inventory(InventoryException error) {
        return response(error.status(), error.code(), error.getMessage());
    }

    @ExceptionHandler({MethodArgumentNotValidException.class, ConstraintViolationException.class,
        HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class,
        MissingServletRequestParameterException.class})
    public ResponseEntity<ErrorBody> invalid(Exception error) {
        return response(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "输入不合法，请检查必填项、数量、单位和日期");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorBody> conflict(DataIntegrityViolationException error) {
        return response(HttpStatus.CONFLICT, "INVENTORY_CONFLICT", "批次已存在或数据冲突，请刷新并编辑原记录");
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ErrorBody> stale(ObjectOptimisticLockingFailureException error) {
        return response(HttpStatus.CONFLICT, "STALE_VERSION", "库存已更新，请刷新后重试");
    }

    private ResponseEntity<ErrorBody> response(HttpStatus status, String code, String message) {
        return ResponseEntity.status(status).body(new ErrorBody(false, message, null, code));
    }
}
