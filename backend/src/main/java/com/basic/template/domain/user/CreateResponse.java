package com.basic.template.domain.user;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

@Data
public class CreateResponse implements Serializable {

    @Serial
    private static final long serialVersionUID = 7117773917945567364L;
    private Long id;

    public CreateResponse(){}

    public CreateResponse(Long id) {
        this.id = id;
    }
}
