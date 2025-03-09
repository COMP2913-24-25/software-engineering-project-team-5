import React, {useState, useEffect} from "react";
import Select from "react-select";

const Tag_selector = ({ selected_tags, set_selected_tags }) => {
    const [tags, set_tags] = useState([]);

    useEffect(() => {

        try {
            fetch("http://localhost:5000/api/get-tags")
                .then((response) => response.json())
                .then((data) => {
                    set_tags(data.map(tag => ({value: tag.Type_id, label: tag.Type_name})));
                }).catch((error) => console.error("Error fetching tags: ", error));

        } catch (error) {
            console.error("Error: ", error);
        }

        
    }, []);
    
    const handleChange = (selected_tags) => {
        if (selected_tags.length <= 3) {
            set_selected_tags(selected_tags);
        } else {
            alert("You can only select up to 3 tags!");
        }
    }; 
    
    console.log(tags)

    return (
        <div>
            <Select isMulti options={tags} value={selected_tags} onChange={handleChange} placeholder="Select tags"/>
        </div>
    );
};


export default Tag_selector;