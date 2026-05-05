package com.camp.backend.dto;

public class CampsiteRevenuResponse {
    private Long campsiteId;
    private String campsiteName;
    private String location;
    private Long reservationCount;
    private Double totalRevenue;

    public CampsiteRevenuResponse(Long campsiteId, String campsiteName, String location, Long reservationCount, Double totalRevenue) {
        this.campsiteId = campsiteId;
        this.campsiteName = campsiteName;
        this.location = location;
        this.reservationCount = reservationCount;
        this.totalRevenue = totalRevenue;
    }

    public Long getCampsiteId() { return campsiteId; }
    public String getCampsiteName() { return campsiteName; }
    public String getLocation() { return location; }
    public Long getReservationCount() { return reservationCount; }
    public Double getTotalRevenue() { return totalRevenue; }
}