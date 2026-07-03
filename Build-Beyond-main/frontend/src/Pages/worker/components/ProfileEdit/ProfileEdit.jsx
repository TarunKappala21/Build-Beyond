import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfileEdit.css';
import PersonalInfoSection from './sub-components/PersonalInfoSection';
import AboutSection from './sub-components/AboutSection';
import ProjectsSection from './sub-components/ProjectsSection';

const ProfileEdit = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    professionalTitle: '',
    experience: '',
    about: '',
    specialties: [],
    profileImage: null,
    projects: []
  });
  const [profilePreview, setProfilePreview] = useState(null);
  const [projectCount, setProjectCount] = useState(0);

  const specialtiesOptions = [
    { id: 'sustainable', label: 'Sustainable design', value: 'Sustainable design' },
    { id: 'urban', label: 'Urban planning', value: 'Urban planning' },
    { id: 'residential', label: 'Residential architecture', value: 'Residential architecture' },
    { id: 'commercial', label: 'Commercial architecture', value: 'Commercial architecture' },
    { id: 'interior', label: 'Interior design', value: 'Interior design' },
    { id: 'landscape', label: 'Landscape architecture', value: 'Landscape architecture' }
  ];

  useEffect(() => {
    fetchWorkerData();
  }, []);

  const fetchWorkerData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const workerId = user?.user_id;

      if (!workerId) {
        console.error('No worker ID found');
        return;
      }

      const response = await fetch(`/api/workers/${workerId}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const worker = await response.json();
        setFormData({
          name: worker.name || '',
          professionalTitle: worker.professionalTitle || '',
          experience: worker.experience || '',
          about: worker.about || '',
          specialties: worker.specialties || [],
          profileImage: null,
          projects: worker.projects || []
        });

        if (worker.profileImage) {
          setProfilePreview(worker.profileImage);
        }

        if (worker.projects && worker.projects.length > 0) {
          setProjectCount(worker.projects.length);
        }
      } else {
        console.error('Failed to fetch worker data');
      }
    } catch (error) {
      console.error('Error fetching worker data:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        profileImage: file
      });

      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSpecialtyChange = (e) => {
    const { value, checked } = e.target;
    let newSpecialties = [...formData.specialties];

    if (checked) {
      newSpecialties.push(value);
    } else {
      newSpecialties = newSpecialties.filter(s => s !== value);
    }

    setFormData({
      ...formData,
      specialties: newSpecialties
    });
  };

  const handleProjectChange = (index, field, value) => {
    const newProjects = [...formData.projects];
    newProjects[index] = {
      ...newProjects[index],
      [field]: value
    };
    setFormData({
      ...formData,
      projects: newProjects
    });
  };

  const handleProjectImageChange = (index, file) => {
    const newProjects = [...formData.projects];
    newProjects[index] = {
      ...newProjects[index],
      imageFile: file
    };

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      newProjects[index].imagePreview = e.target.result;
      setFormData({
        ...formData,
        projects: newProjects
      });
    };
    reader.readAsDataURL(file);
  };

  const addProject = () => {
    setFormData({
      ...formData,
      projects: [
        ...formData.projects,
        { name: '', year: '', location: '', description: '', image: '', imageFile: null, imagePreview: null }
      ]
    });
    setProjectCount(projectCount + 1);
  };

  const removeProject = (index) => {
    const newProjects = formData.projects.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      projects: newProjects
    });
    setProjectCount(projectCount - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const submitFormData = new FormData();
      submitFormData.append('name', formData.name);
      submitFormData.append('title', formData.professionalTitle);
      submitFormData.append('experience', formData.experience);
      submitFormData.append('about', formData.about);

      // Add specialties
      formData.specialties.forEach(specialty => {
        submitFormData.append('specialties', specialty);
      });

      // Add profile image if changed
      if (formData.profileImage) {
        submitFormData.append('profileImage', formData.profileImage);
      }

      // Add projects
      formData.projects.forEach((project, index) => {
        submitFormData.append(`projectName-${index + 1}`, project.name);
        submitFormData.append(`projectYear-${index + 1}`, project.year);
        submitFormData.append(`projectLocation-${index + 1}`, project.location);
        submitFormData.append(`projectDescription-${index + 1}`, project.description);
        
        if (project.imageFile) {
          submitFormData.append(`projectImage-${index + 1}`, project.imageFile);
        }
      });

      const response = await fetch('/api/worker/profile/update', {
        method: 'POST',
        credentials: 'include',
        body: submitFormData
      });

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.indexOf('application/json') !== -1) {
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || 'Failed to update profile');
        }
        alert(result.message || 'Profile updated successfully!');
        navigate('/workerdashboard');
      } else {
        console.error('Received non-JSON response, likely an auth redirect.');
        alert('Your session may have expired. Please log in again.');
        window.location.href = '/signin_up';
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile: ' + error.message);
    }
  };

  return (
    <div className="wkpe-container">
      <button 
        type="button" 
        onClick={() => navigate(-1)} 
        className="wkpe-back-btn"
      >
        <i className="fas fa-arrow-left"></i> Back
      </button>
      <h1>Architect Profile Form</h1>

      <form onSubmit={handleSubmit} className="wkpe-form">
        {/* Personal Info Section */}
        <PersonalInfoSection
          formData={formData}
          profilePreview={profilePreview}
          onInputChange={handleInputChange}
          onImageChange={handleProfileImageChange}
        />

        {/* About Section */}
        <AboutSection
          formData={formData}
          specialtiesOptions={specialtiesOptions}
          onInputChange={handleInputChange}
          onSpecialtyChange={handleSpecialtyChange}
        />

        {/* Projects Section */}
        <ProjectsSection
          projects={formData.projects}
          onAddProject={addProject}
          onRemoveProject={removeProject}
          onProjectChange={handleProjectChange}
          onProjectImageChange={handleProjectImageChange}
        />

        <button type="submit" className="wkpe-submit-btn">
          Update Profile
        </button>
      </form>
    </div>
  );
};

export default ProfileEdit;
