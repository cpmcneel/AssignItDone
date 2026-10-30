package com.assignitdone.backend.controller;

import com.assignitdone.backend.api.TasksApi;
import com.assignitdone.backend.api.model.CreateTaskRequest;
import com.assignitdone.backend.api.model.TaskResponse;
import com.assignitdone.backend.api.model.UpdateTaskRequest;
import com.assignitdone.backend.service.TaskService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TaskController implements TasksApi {

	private final TaskService service;

	public TaskController(TaskService service) {
		this.service = service;
	}

	@Override
	public ResponseEntity<TaskResponse> createTask(CreateTaskRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(service.createTask(request));
	}

	@Override
	public ResponseEntity<List<TaskResponse>> listTasks() {
		return ResponseEntity.ok(service.listTasks());
	}

	@Override
	public ResponseEntity<TaskResponse> updateTask(Long id, UpdateTaskRequest request) {
		return ResponseEntity.ok(service.updateTask(id, request));
	}

	@Override
	public ResponseEntity<Void> deleteTask(Long id) {
		service.deleteTask(id);
		return ResponseEntity.noContent().build();
	}

}
