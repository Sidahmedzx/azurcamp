package com.camp.backend.repository;

import com.camp.backend.entity.ApprovalStatus;
import com.camp.backend.entity.Campsite;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.camp.backend.entity.UserRole;

public interface CampsiteRepository extends JpaRepository<Campsite, Long> {
    List<Campsite> findByApprovalStatus(ApprovalStatus status);
    Page<Campsite> findByApprovalStatus(ApprovalStatus status, Pageable pageable);
    List<Campsite> findByApprovalStatusAndCreatedAtBefore(ApprovalStatus status, LocalDateTime cutoff);

    @Query("SELECT c FROM Campsite c WHERE c.owner.id = :ownerId")
    List<Campsite> findByOwnerId(@Param("ownerId") Long ownerId);
    @Query(value = "SELECT c.id AS campsiteId, c.name AS campsiteName, c.location AS location, " +
            "COUNT(r.id) AS reservationCount, " +
            "SUM(c.nightly_price * DATEDIFF(r.end_date, r.start_date)) AS totalRevenue " +
            "FROM reservations r JOIN campsites c ON r.campsite_id = c.id " +
            "WHERE r.status = 'CONFIRMED' " +
            "GROUP BY c.id, c.name, c.location " +
            "ORDER BY totalRevenue DESC",
            nativeQuery = true)
    List<Object[]> findTopCampsitesByRevenue();
    List<Campsite> findByOwner_RoleAndCapacityGreaterThanEqualAndApprovalStatusOrderByNightlyPriceAsc(
            com.camp.backend.entity.UserRole role, Integer minCapacity, ApprovalStatus status);
}
