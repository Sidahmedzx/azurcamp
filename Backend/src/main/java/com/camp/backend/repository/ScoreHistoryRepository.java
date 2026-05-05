package com.camp.backend.repository;

import com.camp.backend.entity.ScoreHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ScoreHistoryRepository extends JpaRepository<ScoreHistory, Long> {
    
    List<ScoreHistory> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    @Query("SELECT sh FROM ScoreHistory sh JOIN sh.user u ORDER BY u.karma DESC")
    List<ScoreHistory> findLeaderboard();
}
