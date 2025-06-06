import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Modal,Button, SecondaryButton } from '../../../../components';
import { FormattedMessage } from '../../../../util/reactIntl';
import classNames from 'classnames';
import { Phone, Search } from 'lucide-react';
import { externalIds, externalEndpoints } from '../../config';
import css from './PlacesSearch.module.css';


const PlacesSearch = ({ onPlaceSelected, userLocation, userEmail }) => {

  const [query, setQuery] = useState(`Laundromats in ${userLocation} open now`);
  const [results, setResults] = useState([]);
  const [iframeUrl, setIframeUrl] = useState('');
  const [iframeUrls, setIframeUrls] = useState({});
  const [isModalOpen, setModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingNumber, setIsFetchingNumber] = useState(false);

  
  const onManageDisableScrolling = (isDisabled) => {
    // Implement scrolling management logic if needed
  };

  const handleSearch = async () => {
    try {
      setIsSearching(true);
      const response = await fetch(`${externalEndpoints.googlePlacesWorker}?q=${encodeURIComponent(query)}`);
      const places = await response.json();

      if (Array.isArray(places)) {
        setResults(places);
        setIsSearching(false);
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
  };

  const handlePlaceSelected = async (result) => {
    console.log('handlePlaceSelected');

    if(isFetchingNumber) {
        console.log('already fetching number...');
        return;
    }
    
    //clear it first
    setIframeUrl('');

    if(iframeUrls[result.place_id]) {
        console.log('EXISTS: iframeUrl already exists', iframeUrls[result.place_id]);
        setIframeUrl(iframeUrls[result.place_id]);
        setModalOpen(true);
        return;
    }

    try {
        console.log('FETCHING: place details');
        setIsFetchingNumber(true);
        const response = await fetch(`${externalEndpoints.googlePlacesWorker}/?place_id=${result.place_id}`);
        const placeDetails = await response.json();
        const phoneNumber = placeDetails.phone;

        if(!phoneNumber) {
            console.log('NO PHONE NUMBER');
            setIsFetchingNumber(false);
            alert('Sorry, there is no phone number found for this place... removing from list');
            setResults(results.filter(r => r.place_id !== result.place_id));
            return;
        }

        const location = result.address;
        const businessType = result.categories[0].replaceAll('_', ' ');
        const businessName = result.name;
       
        const iframeUrl = `https://form.jotform.com/${externalIds.jotformCall}?userEmail=${encodeURIComponent(userEmail)}&businessType=${encodeURIComponent(businessType)}&businessName=${encodeURIComponent(businessName)}&location=${encodeURIComponent(location)}&phoneNumber=${encodeURIComponent(phoneNumber)}`;

        setIframeUrls(prevUrls => ({ ...prevUrls, [result.place_id]: iframeUrl }));
        setIframeUrl(iframeUrl);
        setIsFetchingNumber(false);
        setModalOpen(true);
        onPlaceSelected(result);

    } catch (error) {

      console.error('Error fetching phone number:', error);

    }
  };

  const extractLocationDetails = (address) => {
    const parts = address.split(',');
    const length = parts.length;
    return parts[length - 3] + ', ' + parts[length - 2];
  };

  return (
    <div className={css.placesSearchContainer}>
        <div className={css.searchTitle}><FormattedMessage id="AgentTraining.searchTitle" /></div>
        <div className={css.searchBoxContainer}>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Salons in Miami, FL open now`}
                className={css.searchInput}
            />
            <Button 
            type="submit" 
            onClick={handleSearch} className={css.searchButton}
            disabled={isSearching}
            >
                <Search/> &nbsp;
                <FormattedMessage id="AgentTraining.searchButtonLabel" />
            </Button>
        </div>

        <div className={css.resultsContainer}>
            {isSearching ? (
                <div className={css.searching}><FormattedMessage id="AgentTraining.searching" /></div>
            ) : 

                results.map((result, index) => {
                    const location = extractLocationDetails(result.address);
                    const businessType = result.categories[0].replaceAll('_', ' ');
                    const businessName = result.name;
                    const iframeUrl = iframeUrls[result.place_id];

                    const rowClass = classNames(css.resultRow, {
                        [css.called]: iframeUrl,
                    });

                    return (
                    <div key={index} className={rowClass}>
                        <span className={css.businessName}>{businessName}</span>
                        <span><label>{businessType}</label></span>
                        <span>{location}</span> 
                        <span>
                            <label className={css[result.openNow ? 'openNow' : 'closedNow']}>{result.openNow ? 'Open' : 'Closed'}</label>
                        </span>
                                            
                        <span>
                            <SecondaryButton 
                            onClick={() => handlePlaceSelected(result)} 
                            className={css.callButton}
                            >
                                <Phone/> <FormattedMessage id="AgentTraining.callButtonLabel" />
                            </SecondaryButton>
                        </span>

                    </div>
                    );
                })

            }
        </div>

    <Modal
        id="iframeModal"
        isOpen={isModalOpen}
        containerClassName={css.modalContainer}
        closeButtonClassName={css.closeButton}
        closeButtonMessage=" "
        onClose={() => {
            setModalOpen(false);
            onManageDisableScrolling(false); // Allow scrolling when modal is closed
        }}
        onManageDisableScrolling={onManageDisableScrolling} // Pass the function to manage scrolling
        usePortal
    >
        <iframe 
            src={iframeUrl} 
            className={css.modal} 
            border="0" 
            title="Modal Content" 
        />
    </Modal>

    </div>
  );
};

PlacesSearch.propTypes = {
  onPlaceSelected: PropTypes.func.isRequired,
  userLocation: PropTypes.string.isRequired,
  userEmail: PropTypes.string.isRequired,
};

export default PlacesSearch; 