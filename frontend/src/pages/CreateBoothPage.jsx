import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  createBooth,
  getBoothById,
} from "../api/api";

const initialFormData = {
  creatorName: "",
  recipientName: "",
  title: "",
  message: "",
  theme: "birthday",
  photoCount: 4,
};

function CreateBoothPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousFormData) => ({
      ...previousFormData,
      [name]: name === "photoCount" ? Number(value) : value,
    }));
  };

  const getParticipantRole = (participant) => {
    return String(
      participant?.role ??
        participant?.participant_role ??
        participant?.participantRole ??
        participant?.participant_type ??
        participant?.participantType ??
        participant?.type ??
        ""
    )
      .trim()
      .toLowerCase();
  };

  const getParticipantId = (participant) => {
    return (
      participant?.participant_id ??
      participant?.participantId ??
      participant?.id ??
      null
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const creatorName = formData.creatorName.trim();
    const recipientName = formData.recipientName.trim();
    const title = formData.title.trim();
    const message = formData.message.trim();
    const photoCount = Number(formData.photoCount);

    if (!creatorName || !recipientName || !title) {
      setError(
        "Creator name, recipient name, and booth title are required."
      );
      return;
    }

    if (!Number.isInteger(photoCount) || photoCount < 1) {
      setError("Please select a valid number of photos.");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await createBooth({
        creatorName,
        recipientName,
        title,
        message,
        theme: formData.theme,
        photoCount,
      });

      console.log("CREATE BOOTH FULL RESPONSE:", response);
      console.log("CREATE BOOTH RESPONSE DATA:", response?.data);

      /*
        Supported response structures:

        1.
        {
          success: true,
          data: {
            booth_id: "...",
            participants: [...]
          }
        }

        2.
        {
          success: true,
          data: {
            booth: {...},
            creatorParticipant: {...},
            recipientParticipant: {...}
          }
        }

        3.
        {
          booth: {...},
          participants: [...]
        }
      */

      const responseBody = response?.data ?? response ?? {};
      const payload = responseBody?.data ?? responseBody ?? {};

      const booth =
        payload?.booth ??
        payload?.boothData ??
        responseBody?.booth ??
        payload;

      let participants = [
  payload?.participants,
  booth?.participants,
  responseBody?.participants,
  payload?.participantData,
].find((value) => Array.isArray(value)) ?? [];

const boothId =
  booth?.booth_id ??
  booth?.boothId ??
  booth?.id ??
  payload?.booth_id ??
  payload?.boothId ??
  responseBody?.booth_id ??
  responseBody?.boothId ??
  null;

if (!boothId) {
  throw new Error(
    "The booth was created, but the booth ID was not returned."
  );
}

/*
  The create endpoint may return only the booth.
  Fetch the complete booth to obtain participants.
*/
if (participants.length === 0) {
  const boothDetailsResponse = await getBoothById(boothId);

  console.log(
    "GET BOOTH RESPONSE:",
    boothDetailsResponse?.data
  );

  const boothDetailsBody =
    boothDetailsResponse?.data ?? boothDetailsResponse ?? {};

  const boothDetailsPayload =
    boothDetailsBody?.data ?? boothDetailsBody ?? {};

  const completeBooth =
    boothDetailsPayload?.booth ??
    boothDetailsPayload?.boothData ??
    boothDetailsPayload;

  participants = [
    completeBooth?.participants,
    boothDetailsPayload?.participants,
    boothDetailsBody?.participants,
  ].find((value) => Array.isArray(value)) ?? [];
}

console.log("FINAL PARTICIPANTS:", participants);

const creatorFromArray = participants.find(
  (participant) =>
    getParticipantRole(participant) === "creator"
);

const recipientFromArray = participants.find(
  (participant) =>
    getParticipantRole(participant) === "recipient"
);

      const creatorParticipant =
        payload?.creatorParticipant ??
        payload?.creator_participant ??
        payload?.creator ??
        booth?.creatorParticipant ??
        booth?.creator_participant ??
        booth?.creator ??
        responseBody?.creatorParticipant ??
        responseBody?.creator_participant ??
        responseBody?.creator ??
        creatorFromArray ??
        null;

      const recipientParticipant =
        payload?.recipientParticipant ??
        payload?.recipient_participant ??
        payload?.recipient ??
        booth?.recipientParticipant ??
        booth?.recipient_participant ??
        booth?.recipient ??
        responseBody?.recipientParticipant ??
        responseBody?.recipient_participant ??
        responseBody?.recipient ??
        recipientFromArray ??
        null;

      
      const inviteToken =
        booth?.invite_token ??
        booth?.inviteToken ??
        payload?.invite_token ??
        payload?.inviteToken ??
        responseBody?.invite_token ??
        responseBody?.inviteToken ??
        null;

      const creatorParticipantId =
        getParticipantId(creatorParticipant) ??
        payload?.creator_participant_id ??
        payload?.creatorParticipantId ??
        booth?.creator_participant_id ??
        booth?.creatorParticipantId ??
        responseBody?.creator_participant_id ??
        responseBody?.creatorParticipantId ??
        null;

      const recipientParticipantId =
        getParticipantId(recipientParticipant) ??
        payload?.recipient_participant_id ??
        payload?.recipientParticipantId ??
        booth?.recipient_participant_id ??
        booth?.recipientParticipantId ??
        responseBody?.recipient_participant_id ??
        responseBody?.recipientParticipantId ??
        null;

      console.log("PARSED BOOTH:", booth);
      console.log("PARSED PARTICIPANTS:", participants);
      console.log("CREATOR PARTICIPANT:", creatorParticipant);
      console.log("RECIPIENT PARTICIPANT:", recipientParticipant);
      console.log("BOOTH ID:", boothId);
      console.log("CREATOR PARTICIPANT ID:", creatorParticipantId);

      if (!boothId) {
        throw new Error(
          "The booth was created, but the booth ID was not returned by the server."
        );
      }

      if (!creatorParticipantId) {
        throw new Error(
          "The booth was created, but creator participant data is missing. Check the browser console for the backend response."
        );
      }

      const currentBooth = {
        boothId,
        inviteToken,
        creatorParticipantId,
        recipientParticipantId,

        creatorName:
          booth?.creator_name ??
          booth?.creatorName ??
          creatorName,

        recipientName:
          booth?.recipient_name ??
          booth?.recipientName ??
          recipientName,

        title:
          booth?.title ??
          title,

        message:
          booth?.message ??
          message,

        theme:
          booth?.theme ??
          formData.theme,

        photoCount:
          Number(
            booth?.photo_count ??
              booth?.photoCount ??
              photoCount
          ),
      };

      localStorage.setItem(
        "currentBooth",
        JSON.stringify(currentBooth)
      );

      navigate(
        `/booth/${boothId}/creator/${creatorParticipantId}`
      );
    } catch (requestError) {
      console.error("Create booth error:", requestError);

      setError(
        requestError?.response?.data?.message ??
          requestError?.response?.data?.error ??
          requestError?.message ??
          "Unable to create the photo booth."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-container">
      <section className="form-page">
        <div className="form-heading">
          <span>Create a booth</span>

          <h1>Create your shared photo booth</h1>

          <p>
            Enter the details below, take your photos, and send the
            generated invitation link to the other participant.
          </p>
        </div>

        <form className="booth-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="creatorName">
                Your name
              </label>

              <input
                id="creatorName"
                name="creatorName"
                type="text"
                value={formData.creatorName}
                onChange={handleChange}
                placeholder="Enter your name"
                autoComplete="name"
                maxLength={80}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="recipientName">
                Recipient name
              </label>

              <input
                id="recipientName"
                name="recipientName"
                type="text"
                value={formData.recipientName}
                onChange={handleChange}
                placeholder="Enter their name"
                maxLength={80}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="title">
              Card title
            </label>

            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="For example: Happy Birthday Sakshi!"
              maxLength={120}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">
              Personal message
            </label>

            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Write a short message for the final card..."
              maxLength={500}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="theme">
                Theme
              </label>

              <select
                id="theme"
                name="theme"
                value={formData.theme}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value="birthday">
                  Birthday
                </option>

                <option value="friendship">
                  Friendship
                </option>

                <option value="celebration">
                  Celebration
                </option>

                <option value="romantic">
                  Romantic
                </option>

                <option value="minimal">
                  Minimal
                </option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="photoCount">
                Photos per person
              </label>

              <select
                id="photoCount"
                name="photoCount"
                value={formData.photoCount}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value={2}>2 photos</option>
                <option value={4}>4 photos</option>
                <option value={6}>6 photos</option>
                <option value={8}>8 photos</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}

          <button
            className="primary-button form-submit-button"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Creating booth..."
              : "Create booth and open camera"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default CreateBoothPage;