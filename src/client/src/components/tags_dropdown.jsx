import React, {useState, useEffect} from "react";
import Select from "react-select";

const Tag_selector = ({ selected_tags, set_selected_tags }) => {
    const [tags, set_tags] = useState([]);

    useEffect(() => {
        const fetch_tags = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/get-tags");
                if (response.ok){
                    const data = await response.json();
                    set_tags(data.map(tag => ({value: tag.Type_id, label: tag.Type_name})));
                } else {
                    console.error("Failed to get the tags");
                }
    
            } catch (error) {
                console.error("Error: ", error);
            }
        }

        fetch_tags();
    }, []);
    
    const handleChange = (selected_tags) => {
        set_selected_tags(selected_tags || [])
    }; 
    
    return (
        <div>
            <Select isMulti options={tags} value={selected_tags} onChange={handleChange} placeholder="Select tags"/>
        </div>
    );
};


export default Tag_selector;