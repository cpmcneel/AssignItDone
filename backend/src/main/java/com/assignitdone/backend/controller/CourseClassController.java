package com.assignitdone.backend.controller;

import com.assignitdone.backend.api.ClassesApi;
import com.assignitdone.backend.api.model.CourseClassResponse;
import com.assignitdone.backend.api.model.CreateClassRequest;
import com.assignitdone.backend.service.CourseClassService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CourseClassController implements ClassesApi {

	private final CourseClassService service;

	public CourseClassController(CourseClassService service) {
		this.service = service;
	}

	@Override
	public ResponseEntity<List<CourseClassResponse>> listClasses() {
		return ResponseEntity.ok(service.listClasses());
	}

	@Override
	public ResponseEntity<CourseClassResponse> createClass(CreateClassRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(service.createClass(request.getName()));
	}

}
