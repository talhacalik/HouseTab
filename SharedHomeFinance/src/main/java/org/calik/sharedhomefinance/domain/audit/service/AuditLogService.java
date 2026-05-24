package org.calik.sharedhomefinance.domain.audit.service;

import org.calik.sharedhomefinance.domain.audit.entity.AuditActionType;
import org.calik.sharedhomefinance.domain.audit.entity.AuditEntityType;

public interface AuditLogService {

    /**
     * Kritik bir işlemi loglar.
     *
     * @param entityType  Hangi tür kayıt değişti
     * @param entityId    Değişen kaydın id'si
     * @param actionType  Ne işlem yapıldı
     * @param changedById İşlemi yapan kullanıcının id'si
     * @param snapshot    İşlem anındaki veri (JSON string veya özet metin)
     */
    void log(AuditEntityType entityType, Long entityId, AuditActionType actionType,
             Long changedById, String snapshot);
}
