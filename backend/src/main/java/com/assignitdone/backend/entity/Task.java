package com.assignitdone.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tasks")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Task {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Setter(AccessLevel.NONE)
	private Long id;

	@NotNull
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "class_id", nullable = false)
	private CourseClass courseClass;

	@NotNull
	@Size(min = 1, max = 255)
	@Column(name = "title", nullable = false, length = 255)
	private String title;

	@NotNull
	@Column(name = "due_date", nullable = false)
	private LocalDate dueDate;

	@NotNull
	@Positive
	@Column(name = "estimated_minutes", nullable = false)
	private Integer estimatedMinutes;

	@NotNull
	@Enumerated(EnumType.STRING)
	@Column(name = "priority", nullable = false, length = 10)
	private Priority priority = Priority.MEDIUM;

	@Lob
	@Column(name = "note")
	private String note;

	@Column(name = "completed", nullable = false)
	private boolean completed = false;

	public Task(CourseClass courseClass, String title, LocalDate dueDate, Integer estimatedMinutes) {
		this.courseClass = courseClass;
		this.title = title;
		this.dueDate = dueDate;
		this.estimatedMinutes = estimatedMinutes;
	}

}
