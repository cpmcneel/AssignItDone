package com.assignitdone.backend.service;

import com.assignitdone.backend.api.model.CreateTaskRequest;
import com.assignitdone.backend.api.model.TaskResponse;
import com.assignitdone.backend.api.model.UpdateTaskRequest;
import com.assignitdone.backend.entity.CourseClass;
import com.assignitdone.backend.entity.Priority;
import com.assignitdone.backend.entity.Task;
import com.assignitdone.backend.repository.CourseClassRepository;
import com.assignitdone.backend.repository.TaskRepository;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TaskService {

	private final TaskRepository taskRepository;
	private final CourseClassRepository classRepository;

	public TaskService(TaskRepository taskRepository, CourseClassRepository classRepository) {
		this.taskRepository = taskRepository;
		this.classRepository = classRepository;
	}

	@Transactional
	public TaskResponse createTask(CreateTaskRequest request) {
		CourseClass courseClass = classRepository.findById(request.getClassId())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Class not found"));
		Task task = new Task(courseClass, request.getTitle(), request.getDueDate(), request.getEstimatedMinutes());
		if (request.getPriority() != null) {
			task.setPriority(Priority.valueOf(request.getPriority().name()));
		}
		task.setNote(request.getNote());
		task.setCompleted(Boolean.TRUE.equals(request.getCompleted()));
		return toResponse(taskRepository.save(task));
	}

	@Transactional(readOnly = true)
	public List<TaskResponse> listTasks() {
		return taskRepository.findAll(Sort.by("id")).stream()
			.map(this::toResponse)
			.toList();
	}

	@Transactional
	public TaskResponse updateTask(Long id, UpdateTaskRequest request) {
		Task task = findTask(id);
		CourseClass courseClass = classRepository.findById(request.getClassId())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Class not found"));
		task.setCourseClass(courseClass);
		task.setTitle(request.getTitle());
		task.setDueDate(request.getDueDate());
		task.setEstimatedMinutes(request.getEstimatedMinutes());
		task.setPriority(Priority.valueOf(request.getPriority().name()));
		task.setNote(request.getNote());
		task.setCompleted(request.getCompleted());
		return toResponse(taskRepository.save(task));
	}

	@Transactional
	public void deleteTask(Long id) {
		taskRepository.delete(findTask(id));
	}

	private Task findTask(Long id) {
		return taskRepository.findById(id)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
	}

	private TaskResponse toResponse(Task task) {
		return new TaskResponse()
			.id(task.getId())
			.classId(task.getCourseClass().getId())
			.className(task.getCourseClass().getName())
			.title(task.getTitle())
			.dueDate(task.getDueDate())
			.estimatedMinutes(task.getEstimatedMinutes())
			.priority(com.assignitdone.backend.api.model.Priority.valueOf(task.getPriority().name()))
			.note(task.getNote())
			.completed(task.isCompleted());
	}

}
