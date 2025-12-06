package com.basic.template.domain.user;

import lombok.Getter;
import lombok.Setter;

import java.io.Serial;
import java.io.Serializable;

@Setter
@Getter
public  class LoginResponse implements Serializable {
    @Serial
    private static final long serialVersionUID = 1650583123091326774L;

    private String token;
    private User user;

    public LoginResponse(){
        this.user = new User();
    }

    public LoginResponse(String token, Long id, String username) {
        this.user = new User(id, username);
        this.token = token;
    }

    @Getter
    private static class User implements Serializable {
        @Serial
        private static final long serialVersionUID = 6704763763687674159L;
        private Long id;
        private String username;

        public User() {}
        public User(Long id, String username) {
            this.id = id;
            this.username = username;
        }
    }
}