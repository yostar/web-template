import React, { useState, useEffect } from 'react';
import { Phone, FilePenLine } from 'lucide-react';
import classNames from 'classnames';
import { FormattedMessage } from '../../../../util/reactIntl';
import ModalIframeButton from '../ModalIframeButton/ModalIframeButton';
import Cookies from 'js-cookie';

import css from './RegionalPartnerPromo.module.css';

// Create a mapping of icon names to components
const iconMap = {
    Phone: Phone,
    FilePenLine: FilePenLine,
    // Add more icons as needed
};

const RegionalPartnerPromo = ({ address, varient, user }) => {
    const [promoData, setPromoData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(true);

    // Extract region from location.search
    const regionMatch = address?.match(/([^,]+?)(?:\s+\d{5})?,\s*(Canada|United States)$/);
    const region = regionMatch ? regionMatch[1].trim() : null;

    useEffect(() => {
        let partnerId = '';
        if (user?.attributes?.profile?.publicData?.userPromoCode?.indexOf('ppv-') === 0) {
            partnerId = user?.attributes?.profile?.publicData?.userPromoCode;
        } else {
            const params = new URLSearchParams(window.location.search);
            const fprParam = params.get('fpr');
            const fprCookie = Cookies.get('_fprom_ref');
            partnerId = fprParam || fprCookie || '';
        }

        //console.log(' RegionalPartnerPromo partnerId', partnerId)

        if (region || (partnerId && partnerId.indexOf('ppv-') === 0)) {
            setLoading(true);
            fetch(`https://partner-promo-api.vendingvillage.com/?region=${region}&partner=${partnerId}`)
                .then(response => response.json())
                .then(data => {
                    //console.log("partner-promo-data", region, partnerId, data)
                    if (data?.id) {
                        setPromoData(data);
                    } else {
                        setPromoData(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching promo data:', error);
                    setPromoData(null);
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setPromoData(null);
            setLoading(false);
        }
    }, [region]);

    const handleClose = () => {
        setIsVisible(false);
    };

    if (!isVisible || loading || !region || !promoData) {
        return null;
    }

    const classes = classNames(css.root, css[varient]);

    return (
        <div className={classes}>
            <button onClick={handleClose} className={css.closeButton}>&times;</button>
            
            <div className={css.promoContainer}>
                <div className={css.promoBadge}><FormattedMessage id="RegionalPartnerPromo.badgeLabel" /></div>
                {promoData.logo && promoData.logo.length > 0 && (
                    <img className={css.logo} src={promoData.logo} alt={promoData.companyName}/>
                )}
                <div className={css.promoContent}>
                    <h2 className={css.title}>{promoData.promoTitle}</h2>
                    <div className={css.promoTextContainer}>
                        <p
                            className={css.promoText}
                            dangerouslySetInnerHTML={{
                                __html: promoData.promoBody
                                    ?.replace('{companyName}', `<strong>${promoData.companyName}</strong>`)
                                    .replace('{region}', region),
                            }}
                        />
                    </div>
                    <ModalIframeButton 
                        iframeUrl={`https://form.jotform.com/${promoData.formId}?region=${region}&promoTitle=${encodeURIComponent(promoData.promoTitle)}&contactName=${promoData.contactName}&contactEmail=${promoData.contactEmail}&companyName=${promoData.companyName}`} 
                        buttonLabel={promoData.ctaLabel} 
                        icon={iconMap[promoData.icon] || Phone}
                        buttonClassName={css.ctaButton}
                    />
                </div>

            </div>

            <div className={css.selfPromo}>
                <a target="_blank" href="mailto:dave@vendingvillage.com?subject=Partner Promo Inquiry"><FormattedMessage id="RegionalPartnerPromo.selfPromo" /></a>
            </div>
        </div>
    );
}

export default RegionalPartnerPromo;
