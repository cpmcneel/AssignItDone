package com.assignitdone.backend.service;

import com.assignitdone.backend.api.model.CourseClassResponse;
import com.assignitdone.backend.entity.CourseClass;
import com.assignitdone.backend.repository.CourseClassRepository;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CourseClassService {

	private final CourseClassRepository repository;

	public CourseClassService(CourseClassRepository repository) {
		this.repository = repository;
	}

	@Transactional(readOnly = true)
	public List<CourseClassResponse> listClasses() {
		return repository.findAll(Sort.by("id")).stream()
			.map(this::toResponse)
			.toList();
	}

	@Transactional
	public CourseClassResponse createClass(String name) {
		return toResponse(repository.save(new CourseClass(name)));
	}

	private CourseClassResponse toResponse(CourseClass courseClass) {
		return new CourseClassResponse(courseClass.getId(), courseClass.getName());
	}

}
