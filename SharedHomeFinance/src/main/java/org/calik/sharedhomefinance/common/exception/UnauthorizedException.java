package org.calik.sharedhomefinance.common.exception;

public class UnauthorizedException extends RuntimeException {

    public UnauthorizedException(String message) {
        super(message);
    }

    public UnauthorizedException() {
        super("Kimlik doğrulama gerekli.");
    }
}