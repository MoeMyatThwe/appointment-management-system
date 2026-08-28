package com.pm.appointmentservice.dto;
public record CustomerDTO(
    String id,
    String name,
    String email,
    String phone,
    String notes,
    String customerGroup,
    String tags) {}
