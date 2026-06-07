import {useParams} from "react-router";

const Resume = () => {
    const { id } = useParams();

    return (
        <div>Resume {id}</div>
    )
}
export default Resume