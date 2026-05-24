package org.calik.sharedhomefinance.domain.notification.repository;

import org.calik.sharedhomefinance.domain.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /** Okunmamışlar önce, sonra tarihe göre azalan sıra */
    @Query("""
            SELECT n FROM Notification n
            WHERE n.user.id = :userId
            ORDER BY n.read ASC, n.createdAt DESC
            """)
    List<Notification> findAllByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.user.id = :userId AND n.read = false")
    void markAllAsRead(@Param("userId") Long userId);

    long countByUserIdAndReadFalse(Long userId);
}
