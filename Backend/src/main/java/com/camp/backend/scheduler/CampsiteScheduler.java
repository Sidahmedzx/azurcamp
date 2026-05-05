package com.camp.backend.scheduler;
import com.camp.backend.entity.ApprovalStatus;
import com.camp.backend.entity.Campsite;
import com.camp.backend.repository.CampsiteRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class CampsiteScheduler {

    private final CampsiteRepository campsiteRepository;

    public CampsiteScheduler(CampsiteRepository campsiteRepository) {
        this.campsiteRepository = campsiteRepository;
    }

    @Scheduled(cron = "0 0 2 * * *")
    public void autoCancelExpiredPendingCampsites() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(7);

        List<Campsite> expiredPending = campsiteRepository
                .findByApprovalStatusAndCreatedAtBefore(ApprovalStatus.PENDING, cutoff);

        if (expiredPending.isEmpty()) {
            System.out.println("Scheduler: No expired pending campsites found.");
            return;
        }

        for (Campsite campsite : expiredPending) {
            campsite.setApprovalStatus(ApprovalStatus.CANCELLED);
        }

        campsiteRepository.saveAll(expiredPending);

        System.out.println("Scheduler: Auto-cancelled " + expiredPending.size() + " expired pending campsites.");
    }
}