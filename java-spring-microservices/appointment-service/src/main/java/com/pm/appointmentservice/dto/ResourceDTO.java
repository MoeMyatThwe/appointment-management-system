package com.pm.appointmentservice.dto;

public record ResourceDTO(
    String id,
    String name,
    String resourceType,
    String description,
    Integer capacity,
    boolean active) {
}
