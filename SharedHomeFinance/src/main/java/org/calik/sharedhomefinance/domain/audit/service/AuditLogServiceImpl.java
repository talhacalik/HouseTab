package org.calik.sharedhomefinance.domain.audit.service;

import lombok.RequiredArgsConstructor;
import org.calik.sharedhomefinance.domain.audit.entity.AuditActionType;
import org.calik.sharedhomefinance.domain.audit.entity.AuditEntityType;
import org.calik.sharedhomefinance.domain.audit.entity.AuditLog;
import org.calik.sharedhomefinance.domain.audit.repository.AuditLogRepository;
import org.calik.sharedhomefinance.domain.user.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogServiceImpl.class);

    private final AuditLogRepository auditLogRepository;
    private final UserService userService;

    /**
     * Bağımsız transaction'da çalışır: asıl işlem rollback olsa da log kaydı tutulur.
     * Async: log yazımı asıl iş akışını yavaşlatmaz.
     */
    @Async
    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(AuditEntityType entityType, Long entityId, AuditActionType actionType,
                    Long changedById, String snapshot) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .entityType(entityType)
                    .entityId(entityId)
                    .actionType(actionType)
                    .changedBy(userService.getById(changedById))
                    .jsonSnapshot(snapshot)
                    .build();

            auditLogRepository.save(auditLog);
        } catch (Exception ex) {
            log.error("Audit log yazılamadı [{} #{} {}]: {}",
                    entityType, entityId, actionType, ex.getMessage());
        }
    }
}
