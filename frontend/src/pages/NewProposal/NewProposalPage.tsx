import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, X, Camera, Check } from 'lucide-react';
import { getApiErrorMessage } from '@/api/error';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader, PageShell } from '@/components/Layout';
import { useCreateProposalMutation } from '@/query/hooks/useCreateProposalMutation'
import './NewProposalPage.css';

const NewProposalPage: React.FC = () => {
  const navigate = useNavigate();
  const { mealId } = useParams();
  const toast = useToast();
  const createProposalMutation = useCreateProposalMutation()
  const [formData, setFormData] = useState({
    dishName: '',
    ingredients: '',
    notes: '',
    restaurantName: '',
    restaurantLink: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealId) {
      toast.error('Missing meal id.');
      return;
    }
    try {
      const trimmedRestaurantName = formData.restaurantName.trim()
      const trimmedRestaurantLink = formData.restaurantLink.trim()
      if ((trimmedRestaurantName || trimmedRestaurantLink) && !trimmedRestaurantName) {
        toast.error('Restaurant name is required when adding restaurant info.')
        return
      }

      const extra: {
        imageUrls?: string[]
        restaurant?: { name: string; addressUrl?: string }
      } = {}

      if (trimmedRestaurantName) {
        extra.restaurant = {
          name: trimmedRestaurantName,
          addressUrl: trimmedRestaurantLink ? trimmedRestaurantLink : undefined,
        }
      }

      await createProposalMutation.mutateAsync({
        mealId,
        dishName: formData.dishName,
        ingredients: formData.ingredients || undefined,
        notes: formData.notes || undefined,
        extra: Object.keys(extra).length > 0 ? extra : undefined,
      });
      toast.success('Proposal submitted.');
      navigate(`/meals/${mealId}/vote`);
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to submit proposal.');
      toast.error(message);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="new-proposal-page">
      <PageShell>
        <PageHeader
          title="New Proposal"
          align="center"
          left={
            <Button variant="ghost" size="icon" className="btn-back" onClick={() => navigate(-1)} aria-label="Go back">
              <ArrowLeft size={24} />
            </Button>
          }
          right={<div style={{ width: 40 }} />}
        />

        <section className="proposal-hero">
          <h2 className="hero-title">What's cooking?</h2>
          <p className="hero-subtitle">Share your delicious idea with the family.</p>
        </section>

        <form className="proposal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="dishName" className="form-label">
              Dish Name
            </label>
            <div className="input-group">
              <Input
                type="text"
                id="dishName"
                name="dishName"
                className="pr-12"
                placeholder="e.g., Grandma's Lasagna"
                value={formData.dishName}
                onChange={handleChange}
                required
              />
              {formData.dishName && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="btn-clear h-6 w-6 p-0"
                  aria-label="Clear dish name"
                  onClick={() => setFormData((prev) => ({ ...prev, dishName: '' }))}
                >
                  <X size={16} />
                </Button>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="ingredients" className="form-label">
              Ingredients Needed
            </label>
            <Textarea
              id="ingredients"
              name="ingredients"
              className="textarea"
              placeholder="List essential items..."
              value={formData.ingredients}
              onChange={handleChange}
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes" className="form-label">
              Notes for the family
            </label>
            <Textarea
              id="notes"
              name="notes"
              className="textarea"
              placeholder="Prep time, spice level, or special instructions..."
              value={formData.notes}
              onChange={handleChange}
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="restaurantName" className="form-label">
              Restaurant (optional)
            </label>
            <Input
              type="text"
              id="restaurantName"
              name="restaurantName"
              placeholder="e.g., Pho 79"
              value={formData.restaurantName}
              onChange={handleChange}
            />
            <Input
              type="url"
              id="restaurantLink"
              name="restaurantLink"
              placeholder="Google Maps link (optional)"
              value={formData.restaurantLink}
              onChange={handleChange}
              className="mt-2"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Extra (Photo)</label>
            <div className="photo-upload">
              <Camera size={48} className="upload-icon" />
              <p className="upload-text">Tap to upload a photo</p>
              <p className="upload-hint">Supports JPG & PNG</p>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="btn-submit"
            disabled={createProposalMutation.isPending || !mealId}
          >
            {createProposalMutation.isPending ? <span className="spinner" aria-hidden="true" /> : <Check size={20} />}
            <span>{createProposalMutation.isPending ? 'Submitting…' : 'Submit Proposal'}</span>
          </Button>
        </form>
      </PageShell>
    </div>
  );
};

export default NewProposalPage;
