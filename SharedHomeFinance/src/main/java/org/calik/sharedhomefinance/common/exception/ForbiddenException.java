package org.calik.sharedhomefinance.common.exception;

public class ForbiddenException extends RuntimeException {

    public ForbiddenException(String message) {
        super(message);
    }

    public ForbiddenException() {
        super("Bu işlem için yetkiniz yok.");
    }
}