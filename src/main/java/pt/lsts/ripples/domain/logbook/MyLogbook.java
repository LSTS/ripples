package pt.lsts.ripples.domain.logbook;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import javax.persistence.CascadeType;
import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.OneToMany;

@Entity
public class MyLogbook {

  @Id
  private String name;

  @ElementCollection
  @OneToMany(cascade=CascadeType.ALL)
  private List<MyAnnotation> annotations;

  private Date date;

  public MyLogbook() {
    this.setName("");
    this.setAnnotations(new ArrayList<MyAnnotation>());
    this.setDate(new Date());
  }

  public MyLogbook(String name) {
    this.setName(name);
    this.setAnnotations(new ArrayList<MyAnnotation>());
    this.setDate(new Date());
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public List<MyAnnotation> getAnnotations() {
    return annotations;
  }

  public MyAnnotation getAnnotation(Long id) {
    for (MyAnnotation ann: this.annotations) {
      if (ann.getId() == id) {
        return ann;
      }
    }
    return null;
  }

  public void setAnnotations(List<MyAnnotation> annotations) {
    this.annotations = annotations;
  }

  public Date getDate() {
    return date;
  }

  public void setDate(Date date) {
    this.date = date;
  }

  public void addAnnotation(MyAnnotation newAnnotation) {
    this.annotations.add(newAnnotation);
    this.annotations.sort((d1,d2) -> d1.compareTo(d2));
  }

  public void editAnnotation(MyAnnotation newAnnotation) {
    MyAnnotation annotation = getAnnotation(newAnnotation.getId());
    if (annotation != null) {
      annotation.setLatitude(newAnnotation.getLatitude());
      annotation.setLongitude(newAnnotation.getLongitude());
      annotation.setContent(newAnnotation.getContent());
    }
  }

  public void deleteAnnotationById(Long annotationId) {
    this.annotations.removeIf(ann -> ann.getId() == annotationId);
  }
}