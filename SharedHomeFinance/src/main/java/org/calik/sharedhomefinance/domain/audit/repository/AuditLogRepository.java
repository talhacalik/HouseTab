package org.calik.sharedhomefinance.domain.audit.repository;

import org.calik.sharedhomefinance.domain.audit.entity.AuditActionType;
import org.calik.sharedhomefinance.domain.audit.entity.AuditEntityType;
import org.calik.sharedhomefinance.domain.audit.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findAllByEntityTypeAndEntityIdOrderByTimestampDesc(
            AuditEntityType entityType, Long entityId);

    List<AuditLog> findAllByChangedByIdOrderByTimestampDesc(Long userId);

    List<AuditLog> findAllByEntityTypeAndActionTypeOrderByTimestampDesc(
            AuditEntityType entityType, AuditActionType actionType);
}
